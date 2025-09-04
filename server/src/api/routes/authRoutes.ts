import { Express } from 'express';
import { AuthController } from '../controllers/AuthController';
import { requireAuth } from '../../middleware/requireAuth';

export function registerAuthRoutes(app: Express) {
    const authCtrl = new AuthController();

    // Auth routes (Google OIDC only)
    app.post('/auth/google', authCtrl.googleLogin);
    app.post('/auth/logout', requireAuth(), authCtrl.logout);
    app.post('/auth/refresh', authCtrl.refreshToken);
}
