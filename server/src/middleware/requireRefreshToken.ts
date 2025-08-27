// src/middleware/requireRefreshToken.ts

import { Request, Response, NextFunction } from 'express';
import { container } from '../config/container';
import { IJwtService } from '../application/services/IJwtService';
import { IRefreshTokenRepository } from '../application/repositories/IRefreshTokenRepository';

export function requireRefreshToken() {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            // Accept from cookie, body, or header
            const refreshToken =
                req.cookies?.refreshToken || req.body?.refreshToken || req.headers['x-refresh-token'];
            if (!refreshToken || typeof refreshToken !== 'string') {
                return res.status(401).json({ message: 'Refresh token missing' });
            }
            const jwtService = container.resolve<IJwtService>('IJwtService');
            const refreshRepo = container.resolve<IRefreshTokenRepository>('IRefreshTokenRepository');
            let decoded: any;
            try {
                decoded = jwtService.verify(refreshToken);
                if (!decoded || decoded.type !== 'refresh') {
                    return res.status(401).json({ message: 'Invalid refresh token' });
                }
            } catch (e) {
                return res.status(401).json({ message: 'Invalid or expired refresh token' });
            }
            const isRevoked = await refreshRepo.isRevoked(refreshToken);
            if (isRevoked) {
                return res.status(401).json({ message: 'Refresh token revoked' });
            }
            req.user = decoded;
            next();
        } catch (err: any) {
            return res.status(500).json({ message: 'Token check failed', detail: err.message });
        }
    };
}
