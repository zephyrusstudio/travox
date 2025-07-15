import { injectable, inject } from 'tsyringe';
import { IUserRepository } from '../application/Repositories/IUserRepository';
import { IJwtService } from '../application/services/IJwtService';
import { compare } from 'bcryptjs'; // Or argon2
import { User } from '../domain/User';
import { IRefreshTokenRepository } from '../application/Repositories/IRefreshTokenRepository';

interface LoginDTO {
    email?: string;
    phone?: string;
    password: string;
}

@injectable()
export class LoginUser {
    constructor(
        @inject('IUserRepository') private users: IUserRepository,
        @inject('IJwtService') private jwt: IJwtService,
        @inject('IRefreshTokenRepository') private refreshTokens: IRefreshTokenRepository
    ) { }

    async execute({ email, phone, password }: LoginDTO) {
        let user: User | null = null;

        // Allow login via either email or phone
        if (email) {
            user = await this.users.findByEmail(email);
        } else if (phone) {
            user = await this.users.findByPhone(phone);
        }

        // Don't reveal whether user exists or not
        if (!user || !user.passwordHash) {
            throw new Error('Invalid credentials');
        }

        if (!user.isActive) {
            throw new Error('Account is not activated');
        }

        // Secure password comparison
        const passwordMatch = await compare(password, user.passwordHash);
        if (!passwordMatch) {
            throw new Error('Invalid credentials');
        }

        // Generate JWT tokens
        const accessToken = this.jwt.signAccessToken({
            sub: user.id,
            email: user.email,
            roles: user.roles,
            name: user.name,
        });

        const refreshToken = this.jwt.signRefreshToken({
            sub: user.id,
            type: 'refresh',
        });

        // Optionally persist refresh token (for rotation/revocation support)
        await this.refreshTokens.store({
            userId: user.id,
            token: refreshToken,
            expiresAt: this.jwt.getRefreshTokenExpiryDate(),
        });

        return {
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                email: user.email,
                phone: user.phone,
                roles: user.roles,
                name: user.name,
            },
        };
    }
}
