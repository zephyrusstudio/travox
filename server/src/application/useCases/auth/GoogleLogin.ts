import { injectable, inject } from 'tsyringe';
import { IUserRepository } from '../../repositories/IUserRepository';
import { IOrganizationRepository } from '../../repositories/IOrganizationRepository';
import { IAuditLogRepository } from '../../repositories/IAuditLogRepository';
import { IJwtService } from '../../services/IJwtService';
import { IGoogleOidcService } from '../../services/IGoogleOidcService';
import { IRefreshTokenRepository } from '../../repositories/IRefreshTokenRepository';
import { User } from '../../../domain/User';
import { Organization } from '../../../domain/Organization';
import { UserRole } from '../../../models/FirestoreTypes';
import { AuditLog } from '../../../domain/AuditLog';

interface GoogleLoginDTO {
    idToken: string;
    orgId?: string; // Optional for auto-organization creation
    allowedDomains?: string[]; // Optional domain allowlist
}

@injectable()
export class GoogleLogin {
    constructor(
        @inject('IUserRepository') private users: IUserRepository,
        @inject('IOrganizationRepository') private organizations: IOrganizationRepository,
        @inject('IAuditLogRepository') private auditLogs: IAuditLogRepository,
        @inject('IJwtService') private jwt: IJwtService,
        @inject('IGoogleOidcService') private googleOidc: IGoogleOidcService,
        @inject('IRefreshTokenRepository') private refreshTokens: IRefreshTokenRepository
    ) { }

    async execute({ idToken, orgId, allowedDomains }: GoogleLoginDTO, ip?: string, userAgent?: string) {
        // 1. Verify Google ID token
        const googleUser = await this.googleOidc.verifyIdToken(idToken);
        if (!googleUser) {
            throw new Error('Invalid Google ID token');
        }

        const { email, name, googleId, emailVerified, picture } = googleUser;

        if (!emailVerified) {
            throw new Error('Email not verified with Google');
        }

        // 2. Check domain allowlist if provided
        if (allowedDomains && allowedDomains.length > 0) {
            const emailDomain = email.split('@')[1];
            if (!allowedDomains.includes(emailDomain)) {
                throw new Error(`Email domain ${emailDomain} is not allowed`);
            }
        }

        // 3. Check if user exists by Google ID first, then by email
        let user = await this.users.findByGoogleId(googleId);
        
        if (!user) {
            // Check if user exists by email (existing user linking Google account)
            user = await this.users.findByEmail(email);
            
            if (user) {
                // Link Google account to existing user
                user.googleId = googleId;
                if (picture) user.avatar = picture;
                user.updatedAt = new Date();
                user = await this.users.update(user);
            }
        }

        let isNewUser = false;
        
        if (!user) {
            isNewUser = true;
            
            let organization: Organization | null = null;

            if (orgId) {
                organization = await this.organizations.findById(orgId);
                if (!organization) {
                    const org = Organization.create(orgId);
                    organization = await this.organizations.create(org);
                }
            } else {
                organization = await this.organizations.findByName('default');
                if (!organization) {
                    const defaultOrg = Organization.create('default');
                    organization = await this.organizations.create(defaultOrg);
                }
            }

            user = User.createFromGoogle(
                organization.id, 
                email, 
                name, 
                googleId, 
                picture
            );
            
            const existingUsers = await this.users.findByOrganizationId(organization.id);
            if (existingUsers.length === 0) {
                user.setRole(UserRole.OWNER);
            } else {
                user.setRole(UserRole.ADMIN);
            }

            user = await this.users.create(user);
        }

        if (!user || !user.isActive) {
            throw new Error('Account is deactivated');
        }

        // 5. Record login
        user.recordLogin();
        await this.users.update(user);

        // 6. Generate JWT tokens
        const accessToken = this.jwt.signAccessToken({
            sub: user.id,
            email: user.email,
            role: user.role,
            name: user.name,
            orgId: user.orgId,
        });

        const refreshToken = this.jwt.signRefreshToken({
            sub: user.id,
            type: 'refresh',
        });

        // 7. Store refresh token
        await this.refreshTokens.store({
            userId: user.id,
            token: refreshToken,
            expiresAt: this.jwt.getRefreshTokenExpiryDate(),
        });

        // 8. Log authentication event
        const auditLog = AuditLog.create(
            user.orgId!,
            user.id,
            'authentication',
            user.id,
            isNewUser ? 'CREATE' : 'LOGIN',
            {
                isNewUser,
                email,
                loginMethod: 'google',
                userAgent,
                ip,
            },
            ip || 'unknown',
            userAgent || 'unknown'
        );
        await this.auditLogs.create(auditLog, user.id);

        return {
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                avatar: user.avatar,
                orgId: user.orgId,
                isNewUser,
            },
        };
    }
}
