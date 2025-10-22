import { Express } from 'express';
import { AuditLogController } from '../controllers/AuditLogController';
import { requireAuth } from '../../middleware/requireAuth';
import { UserRole } from '../../models/FirestoreTypes';

export function registerAuditLogRoutes(app: Express) {
    const auditLogCtrl = new AuditLogController();

    // Audit Log routes (protected - owner only)
    app.post('/audit-logs', requireAuth([UserRole.OWNER]), auditLogCtrl.create);
    app.get('/audit-logs', requireAuth([UserRole.OWNER]), auditLogCtrl.getAll);
    app.get('/audit-logs/export', requireAuth([UserRole.OWNER]), auditLogCtrl.exportToCSV);
    app.get('/audit-logs/entity/:entity/:entityId', requireAuth([UserRole.OWNER]), auditLogCtrl.getByEntity);
    app.get('/audit-logs/actor/:actorId', requireAuth([UserRole.OWNER]), auditLogCtrl.getByActor);
    app.get('/audit-logs/date-range', requireAuth([UserRole.OWNER]), auditLogCtrl.getByDateRange);
}
