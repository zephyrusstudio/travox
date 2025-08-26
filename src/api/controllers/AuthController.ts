import { Request, Response } from 'express';
import { container } from '../../config/container';
import { GoogleLogin } from '../../application/useCases/auth/GoogleLogin';
import { LogoutUser } from '../../application/useCases/auth/LogoutUser';
import { IJwtService } from '../../application/services/IJwtService';
import { IRefreshTokenRepository } from '../../application/repositories/IRefreshTokenRepository';
import { IUserRepository } from '../../application/repositories/IUserRepository';

export class AuthController {
    async googleLogin(req: Request, res: Response) {
        try {
            const useCase = container.resolve(GoogleLogin);
            const { idToken, orgId } = req.body;
            
            if (!idToken) {
                return res.status(400).json({
                    status: 'error',
                    data: { message: 'Google ID token is required' }
                });
            }

            const result = await useCase.execute(
                { idToken, orgId },
                req.ip,
                req.get('User-Agent')
            );

            // Set refresh token as HTTP-only cookie
            res.cookie('refreshToken', result.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
            });

            res.json({
                status: 'success',
                data: {
                    accessToken: result.accessToken,
                    user: result.user,
                }
            });
        } catch (error: any) {
            res.status(401).json({
                status: 'error',
                data: { message: error.message }
            });
        }
    }

    async logout(req: Request, res: Response) {
        try {
            const useCase = container.resolve(LogoutUser);
            const refreshToken = req.cookies?.refreshToken;
            
            await useCase.execute(
                { userId: req.user!.sub, refreshToken },
                req.ip,
                req.get('User-Agent')
            );

            // Clear refresh token cookie
            res.clearCookie('refreshToken');
            res.json({
                status: 'success',
                data: { message: 'Logged out successfully' }
            });
        } catch (error: any) {
            res.status(500).json({
                status: 'error',
                data: { message: error.message }
            });
        }
    }

    async refreshToken(req: Request, res: Response) {
        try {
            // 1. Get refresh token from cookie or body
            const refreshToken =
                req.cookies?.refreshToken || req.body?.refreshToken || req.headers['x-refresh-token'];
            if (!refreshToken || typeof refreshToken !== 'string') {
                return res.status(400).json({
                    status: 'error',
                    data: { message: 'Refresh token missing' }
                });
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
                    return res.status(401).json({
                        status: 'error',
                        data: { message: 'Invalid refresh token' }
                    });
                }
            } catch (e) {
                return res.status(401).json({
                    status: 'error',
                    data: { message: 'Invalid or expired refresh token' }
                });
            }

            // 4. Check revocation
            const isRevoked = await refreshRepo.isRevoked(refreshToken);
            if (isRevoked) {
                return res.status(401).json({
                    status: 'error',
                    data: { message: 'Refresh token revoked or not found' }
                });
            }

            // 5. Fetch user (ensure user still exists and is active)
            const user = await userRepo.findById(decoded.sub);
            if (!user || !user.isActive) {
                return res.status(401).json({
                    status: 'error',
                    data: { message: 'User not found or inactive' }
                });
            }

            // 6. Revoke old refresh token (for rotation)
            await refreshRepo.revoke(refreshToken);

            // 7. Issue new tokens
            const newAccessToken = jwtService.signAccessToken({
                sub: user.id,
                email: user.email,
                role: user.role,
                name: user.name,
                orgId: user.orgId,
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

            // 8. Set new refresh token as cookie
            res.cookie('refreshToken', newRefreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                expires: jwtService.getRefreshTokenExpiryDate(),
            });

            // 9. Return new access token
            return res.json({
                status: 'success',
                data: {
                    accessToken: newAccessToken,
                }
            });
        } catch (err: any) {
            return res.status(500).json({
                status: 'error',
                data: { message: 'Token refresh failed', detail: err.message }
            });
        }
    }
}
