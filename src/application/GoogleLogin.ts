import { injectable, inject } from 'tsyringe';
import { IUserRepository } from './Repositories/IUserRepository';
import { IOrganizationRepository } from './Repositories/IOrganizationRepository';
import { IAuditLogRepository } from './Repositories/IAuditLogRepository';
import { IJwtService } from './services/IJwtService';
import { IGoogleOidcService } from './services/IGoogleOidcService';
import { IRefreshTokenRepository } from './Repositories/IRefreshTokenRepository';
import { User } from '../domain/User';
import { Organization } from '../domain/Organization';
import { UserRole } from '../models/FirestoreTypes';
import { AuditLog } from '../domain/AuditLog';

interface GoogleLoginDTO {
    idToken: string;
    orgId?: string; // Optional for auto-organization creation
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

    async execute({ idToken, orgId }: GoogleLoginDTO, ip?: string, userAgent?: string) {
        // 1. Verify Google ID token
        const googleUser = await this.googleOidc.verifyIdToken(idToken);
        if (!googleUser) {
            throw new Error('Invalid Google ID token');
        }

        const { email, name, googleId, emailVerified, picture } = googleUser;

        if (!emailVerified) {
            throw new Error('Email not verified with Google');
        }

        // 2. Check if user exists by Google ID first, then by email
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
            // 3. Auto-create user on first login
            isNewUser = true;
            
            // Determine organization
            let organization: Organization | null = null;
            
            if (orgId) {
                organization = await this.organizations.findById(orgId);
                if (!organization) {
                    throw new Error('Invalid organization');
                }
            } else {
                // Auto-create organization based on email domain if none specified
                const emailDomain = email.split('@')[1];
                const orgName = `${emailDomain} Organization`;
                
                organization = Organization.create(orgName);
                organization = await this.organizations.create(organization);
            }

            // Create user with default role
            user = User.createFromGoogle(
                organization.id, 
                email, 
                name, 
                googleId, 
                picture
            );
            
            // Set default role - first user in org becomes OWNER, others get VIEWER role
            const existingUsers = await this.users.findByOrganizationId(organization.id);
            if (existingUsers.length === 0) {
                user.roles = [UserRole.OWNER];
            } else {
                user.roles = [UserRole.VIEWER];
            }

            user = await this.users.create(user);
        }

        if (!user.isActive) {
            throw new Error('Account is deactivated');
        }

        // 4. Record login
        user.recordLogin();
        await this.users.update(user);

        // 5. Generate JWT tokens
        const accessToken = this.jwt.signAccessToken({
            sub: user.id,
            email: user.email,
            roles: user.roles,
            name: user.name,
            orgId: user.orgId,
        });

        const refreshToken = this.jwt.signRefreshToken({
            sub: user.id,
            type: 'refresh',
        });

        // 6. Store refresh token
        await this.refreshTokens.store({
            userId: user.id,
            token: refreshToken,
            expiresAt: this.jwt.getRefreshTokenExpiryDate(),
        });

        // 7. Log authentication event
        const auditLog = AuditLog.create(
            user.orgId!,
            user.id,
            'authentication',
            user.id,
            isNewUser ? 'CREATE' : 'VIEW',
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
                roles: user.roles,
                avatar: user.avatar,
                orgId: user.orgId,
                isNewUser,
            },
        };
    }
}
