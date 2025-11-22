import { Express } from 'express';
import { UserController } from '../controllers/UserController';
import { requireAuth } from '../../middleware/requireAuth';
import { UserRole } from '../../models/FirestoreTypes';
import { auditLogger } from '../../middleware/auditLogger';

export function registerUserRoutes(app: Express) {
    const userCtrl = new UserController();

    // User Management routes (protected)
    app.get('/users', requireAuth([UserRole.ADMIN, UserRole.OWNER]), userCtrl.getAll);
    app.get('/users/me', requireAuth(), userCtrl.getCurrentUser);
    app.put('/users/me', requireAuth(), auditLogger('users'), userCtrl.updateProfile);
    app.get('/users/:id', requireAuth([UserRole.ADMIN, UserRole.OWNER]), userCtrl.getById);
    app.post('/users/change-role', requireAuth([UserRole.ADMIN, UserRole.OWNER]), auditLogger('users'), userCtrl.changeRole);
    app.post('/users/:id/activate', requireAuth([UserRole.ADMIN, UserRole.OWNER]), auditLogger('users'), userCtrl.activate);
    app.post('/users/:id/deactivate', requireAuth([UserRole.ADMIN, UserRole.OWNER]), auditLogger('users'), userCtrl.deactivate);
}
