import { Express } from 'express';
import { AuditLogController } from '../controllers/AuditLogController';
import { requireAuth } from '../../middleware/requireAuth';
import { UserRole } from '../../models/FirestoreTypes';

export function registerAuditLogRoutes(app: Express) {
    const auditLogCtrl = new AuditLogController();

    // Audit Log routes (protected - admin/owner only)
    app.post('/audit-logs', requireAuth([UserRole.ADMIN, UserRole.OWNER]), auditLogCtrl.create);
    app.get('/audit-logs', requireAuth([UserRole.ADMIN, UserRole.OWNER]), auditLogCtrl.getAll);
    app.get('/audit-logs/export', requireAuth([UserRole.ADMIN, UserRole.OWNER]), auditLogCtrl.exportToCSV);
    app.get('/audit-logs/entity/:entity/:entityId', requireAuth([UserRole.ADMIN, UserRole.OWNER]), auditLogCtrl.getByEntity);
    app.get('/audit-logs/actor/:actorId', requireAuth([UserRole.ADMIN, UserRole.OWNER]), auditLogCtrl.getByActor);
    app.get('/audit-logs/date-range', requireAuth([UserRole.ADMIN, UserRole.OWNER]), auditLogCtrl.getByDateRange);
}
