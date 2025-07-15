import { Express } from 'express';
import { AuthController } from '../controllers/AuthController';
import { requireAuth } from '../../middleware/requireAuth';

export function registerRoutes(app: Express) {
    const ctrl = new AuthController();

    app.post('/auth/register', ctrl.register);
    app.post('/auth/verify-otp', ctrl.verifyOtp);
    app.post('/auth/login', ctrl.login);
    // app.post('/auth/social/:provider', ctrl.socialLogin);
    app.post('/auth/refresh', ctrl.refreshToken);
    //app.get('/auth/userinfo', requireAuth, ctrl.userInfo);
    // ...add other routes
}
