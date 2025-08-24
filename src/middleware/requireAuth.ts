// src/middleware/requireAuth.ts

import { Request, Response, NextFunction } from 'express';
import { container } from '../config/container';
import { IJwtService } from '../application/services/IJwtService';
import { UserRole } from '../models/FirestoreTypes';

// Extend Express Request type to add user property
declare module 'express-serve-static-core' {
    interface Request {
        user?: {
            sub: string;
            id: string;
            email?: string;
            roles: UserRole[];
            name?: string;
            orgId?: string;
        };
    }
}

/**
 * Middleware to require a valid JWT access token for protected routes.
 * Optionally, you can pass requiredRoles for RBAC.
 */
export function requireAuth(requiredRoles?: UserRole[]) {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            // Get token from Authorization header
            const authHeader = req.headers['authorization'];
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({ message: 'Authorization token missing' });
            }
            const token = authHeader.split(' ')[1];

            // Use DI for JWT verification
            const jwtService = container.resolve<IJwtService>('IJwtService');
            const decoded = jwtService.verify(token);

            if (!decoded) {
                return res.status(401).json({ message: 'Invalid token' });
            }

            // Optionally, check roles
            if (requiredRoles && Array.isArray(requiredRoles) && requiredRoles.length > 0) {
                const userRoles = decoded.roles || [];
                
                // Owner can access everything
                if (!userRoles.includes(UserRole.OWNER)) {
                    const hasRole = requiredRoles.some(role => userRoles.includes(role));
                    if (!hasRole) {
                        return res.status(403).json({ 
                            message: 'Access denied: insufficient privileges',
                            required: requiredRoles,
                            userRoles: userRoles
                        });
                    }
                }
            }

            // Attach decoded user info to request
            req.user = decoded;
            next();
        } catch (err) {
            return res.status(401).json({ message: 'Invalid or expired token' });
        }
    };
}
