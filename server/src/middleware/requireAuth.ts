// src/middleware/requireAuth.ts

import { Request, Response, NextFunction } from 'express';
import { container } from '../config/container';
import { IJwtService } from '../application/services/IJwtService';
import { IUserRepository } from '../application/repositories/IUserRepository';
import { UserRole } from '../models/FirestoreTypes';

// Extend Express Request type to add user property
declare module 'express-serve-static-core' {
    interface Request {
        user?: {
            sub: string;
            id: string;
            email?: string;
            role: UserRole;
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
    return async (req: Request, res: Response, next: NextFunction) => {
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

            // Check if user is still active
            const userRepo = container.resolve<IUserRepository>('IUserRepository');
            const user = await userRepo.findById(decoded.sub);
            
            if (!user || !user.isActive) {
                return res.status(401).json({ message: 'Account is deactivated' });
            }

            // Optionally, check roles
            if (requiredRoles && Array.isArray(requiredRoles) && requiredRoles.length > 0) {
                const userRole = decoded.role;
                
                // Owner can access everything
                if (userRole !== UserRole.OWNER) {
                    const hasRole = requiredRoles.includes(userRole);
                    if (!hasRole) {
                        return res.status(403).json({ 
                            message: 'Access denied: insufficient privileges',
                            required: requiredRoles,
                            userRole: userRole
                        });
                    }
                }
            }

            // Attach decoded user info to request
            // Normalize the JWT payload to ensure 'id' field exists
            req.user = {
                ...decoded,
                id: decoded.sub || decoded.id
            };
            next();
        } catch (err) {
            return res.status(401).json({ message: 'Invalid or expired token' });
        }
    };
}
