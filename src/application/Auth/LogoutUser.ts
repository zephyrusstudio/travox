import { injectable, inject } from 'tsyringe';
import { IRefreshTokenRepository } from '../Repositories/IRefreshTokenRepository';
import { IAuditLogRepository } from '../Repositories/IAuditLogRepository';
import { IUserRepository } from '../Repositories/IUserRepository';
import { AuditLog } from '../../domain/AuditLog';

interface LogoutDTO {
    userId: string;
    refreshToken?: string;
}

@injectable()
export class LogoutUser {
    constructor(
        @inject('IRefreshTokenRepository') private refreshTokens: IRefreshTokenRepository,
        @inject('IAuditLogRepository') private auditLogs: IAuditLogRepository,
        @inject('IUserRepository') private users: IUserRepository
    ) { }

    async execute({ userId, refreshToken }: LogoutDTO, ip?: string, userAgent?: string) {
        // 1. Get user for audit logging
        const user = await this.users.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        // 2. Revoke refresh token if provided
        if (refreshToken) {
            await this.refreshTokens.revoke(refreshToken);
        }

        // 3. Optionally revoke all refresh tokens for this user (if implementing logout from all devices)
        // await this.refreshTokens.revokeAllForUser(userId);

        // 4. Log logout event
        const auditLog = AuditLog.create(
            user.orgId!,
            userId,
            'authentication',
            userId,
            'LOGOUT',
            {
                action: 'logout',
                logoutMethod: 'explicit',
            },
            ip || 'unknown',
            userAgent || 'unknown'
        );
        await this.auditLogs.create(auditLog, userId);

        return { success: true };
    }
}
