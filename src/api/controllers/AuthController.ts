import { Request, Response } from 'express';
import { container } from '../../config/container';
import { RegisterUser } from '../../application/RegisterUser';
import { LoginUser } from '../../application/LoginUser';
import { IJwtService } from '../../application/services/IJwtService';
import { IRefreshTokenRepository } from '../../application/Repositories/IRefreshTokenRepository';
import { IUserRepository } from '../../application/Repositories/IUserRepository';

export class AuthController {
    async register(req: Request, res: Response) {
        const useCase = container.resolve(RegisterUser);
        await useCase.execute(req.body);
        res.status(200).json({ message: 'OTP sent' });
    }

    async verifyOtp(req: Request, res: Response) {
        // ...
    }

    async login(req: Request, res: Response) {
        const useCase = container.resolve(LoginUser);
        const tokens = await useCase.execute(req.body);
        res.json(tokens);
    }

    async refreshToken(req: Request, res: Response) {
        try {
            // 1. Get refresh token from cookie or body (choose your pattern)
            // Here, we check both cookie and body for flexibility
            const refreshToken =
                req.cookies?.refreshToken || req.body?.refreshToken || req.headers['x-refresh-token'];
            if (!refreshToken || typeof refreshToken !== 'string') {
                return res.status(400).json({ message: 'Refresh token missing' });
            }

            // 2. Resolve dependencies
            const jwtService = container.resolve<IJwtService>('IJwtService');
            const refreshRepo = container.resolve<IRefreshTokenRepository>('IRefreshTokenRepository');
            const userRepo = container.resolve<IUserRepository>('IUserRepository');

            // 3. Verify token and check it's not revoked
            let decoded: any;
            try {
                decoded = jwtService.verify(refreshToken);
                if (!decoded || decoded.type !== 'refresh') {
                    return res.status(401).json({ message: 'Invalid refresh token' });
                }
            } catch (e) {
                return res.status(401).json({ message: 'Invalid or expired refresh token' });
            }

            // 4. Check revocation
            const isRevoked = await refreshRepo.isRevoked(refreshToken);
            if (isRevoked) {
                return res.status(401).json({ message: 'Refresh token revoked or not found' });
            }

            // 5. Fetch user (optional: ensure user still exists and is active)
            const user = await userRepo.findById(decoded.sub);
            if (!user || !user.isActive) {
                return res.status(401).json({ message: 'User not found or inactive' });
            }

            // 6. Revoke old refresh token (for rotation)
            await refreshRepo.revoke(refreshToken);

            // 7. Issue new tokens
            const newAccessToken = jwtService.signAccessToken({
                sub: user.id,
                email: user.email,
                roles: user.roles,
                name: user.name,
            });
            const newRefreshToken = jwtService.signRefreshToken({
                sub: user.id,
                type: 'refresh',
            });
            await refreshRepo.store({
                userId: user.id,
                token: newRefreshToken,
                expiresAt: jwtService.getRefreshTokenExpiryDate(),
            });

            // 8. Set new refresh token as cookie (recommended, secure, httpOnly)
            res.cookie('refreshToken', newRefreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                expires: jwtService.getRefreshTokenExpiryDate(),
            });

            // 9. Return new access token
            return res.json({
                accessToken: newAccessToken,
                // Optionally, send refresh token in body for non-browser clients:
                // refreshToken: newRefreshToken,
            });
        } catch (err: any) {
            return res.status(500).json({ message: 'Token refresh failed', detail: err.message });
        }
    }
}
