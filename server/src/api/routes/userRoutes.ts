import { Express } from 'express';
import { UserController } from '../controllers/UserController';
import { requireAuth } from '../../middleware/requireAuth';
import { UserRole } from '../../models/FirestoreTypes';
import { auditLogger } from '../../middleware/auditLogger';

export function registerUserRoutes(app: Express) {
    const userCtrl = new UserController();

    // User Management routes (protected)
    app.get('/users', requireAuth([UserRole.OWNER]), userCtrl.getAll);
    app.get('/users/me', requireAuth(), userCtrl.getCurrentUser);
    app.put('/users/me', requireAuth(), auditLogger('users'), userCtrl.updateProfile);
    app.get('/users/:id', requireAuth([UserRole.OWNER]), userCtrl.getById);
    app.patch('/users/change-role', requireAuth([UserRole.OWNER]), auditLogger('users'), userCtrl.changeRole);
    app.patch('/users/:id/activate', requireAuth([UserRole.OWNER]), auditLogger('users'), userCtrl.activate);
    app.patch('/users/:id/deactivate', requireAuth([UserRole.OWNER]), auditLogger('users'), userCtrl.deactivate);
}
