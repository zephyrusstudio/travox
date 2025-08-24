import { Express } from 'express';
import { AuthController } from '../controllers/AuthController';
import { CustomerController } from '../controllers/CustomerController';
import { VendorController } from '../controllers/VendorController';
import { BookingController } from '../controllers/BookingController';
import { AuditLogController } from '../controllers/AuditLogController';
import { UserController } from '../controllers/UserController';
import { requireAuth } from '../../middleware/requireAuth';
import { UserRole } from '../../models/FirestoreTypes';

export function registerRoutes(app: Express) {
    const authCtrl = new AuthController();
    const customerCtrl = new CustomerController();
    const vendorCtrl = new VendorController();
    const bookingCtrl = new BookingController();
    const auditLogCtrl = new AuditLogController();
    const userCtrl = new UserController();

    // Auth routes (Google OIDC only)
    app.post('/auth/google', authCtrl.googleLogin);
    app.post('/auth/logout', requireAuth(), authCtrl.logout);
    app.post('/auth/refresh', authCtrl.refreshToken);

    // Customer routes (no auth for testing)
    app.post('/customers', customerCtrl.create);
    app.get('/customers', customerCtrl.getAll);
    app.get('/customers/search', customerCtrl.search);
    app.get('/customers/:id', customerCtrl.getById);
    app.get('/customers/:id/stats', customerCtrl.getStats);

    // Vendor routes (no auth for testing)
    app.post('/vendors', vendorCtrl.create);
    app.get('/vendors', vendorCtrl.getAll);
    app.get('/vendors/search', vendorCtrl.search);
    app.get('/vendors/:id', vendorCtrl.getById);
    app.get('/vendors/:id/stats', vendorCtrl.getStats);

    // Booking routes (protected)
    app.post('/bookings', requireAuth(), bookingCtrl.create);
    app.get('/bookings', requireAuth(), bookingCtrl.getAll);
    app.get('/bookings/upcoming', requireAuth(), bookingCtrl.getUpcoming);
    app.get('/bookings/overdue', requireAuth(), bookingCtrl.getOverdue);
    app.get('/bookings/revenue-stats', requireAuth(), bookingCtrl.getRevenueStats);
    app.get('/bookings/travel-dates', requireAuth(), bookingCtrl.getByTravelDates);
    app.get('/bookings/:id', requireAuth(), bookingCtrl.getById);
    app.put('/bookings/:id', requireAuth(), bookingCtrl.update);
    app.patch('/bookings/:id/payment', requireAuth(), bookingCtrl.updatePayment);
    app.patch('/bookings/:id/status', requireAuth(), bookingCtrl.updateStatus);
    app.patch('/bookings/:id/cancel', requireAuth(), bookingCtrl.cancel);
    app.patch('/bookings/:id/confirm', requireAuth(), bookingCtrl.confirm);
    app.patch('/bookings/:id/complete', requireAuth(), bookingCtrl.complete);
    app.delete('/bookings/:id', requireAuth(), bookingCtrl.delete);
    app.patch('/bookings/:id/archive', requireAuth(), bookingCtrl.archive);

    // Audit Log routes (protected - admin/owner only)
    app.post('/audit-logs', requireAuth([UserRole.ADMIN, UserRole.OWNER]), auditLogCtrl.create);
    app.get('/audit-logs', requireAuth([UserRole.ADMIN, UserRole.OWNER]), auditLogCtrl.getAll);
    app.get('/audit-logs/export', requireAuth([UserRole.ADMIN, UserRole.OWNER]), auditLogCtrl.exportToCSV);
    app.get('/audit-logs/entity/:entity/:entityId', requireAuth([UserRole.ADMIN, UserRole.OWNER]), auditLogCtrl.getByEntity);
    app.get('/audit-logs/actor/:actorId', requireAuth([UserRole.ADMIN, UserRole.OWNER]), auditLogCtrl.getByActor);
    app.get('/audit-logs/date-range', requireAuth([UserRole.ADMIN, UserRole.OWNER]), auditLogCtrl.getByDateRange);

    // User Management routes (protected)
    app.get('/users', requireAuth([UserRole.ADMIN, UserRole.OWNER]), userCtrl.getAll);
    app.get('/users/me', requireAuth(), userCtrl.getCurrentUser);
    app.put('/users/me', requireAuth(), userCtrl.updateProfile);
    app.get('/users/:id', requireAuth([UserRole.ADMIN, UserRole.OWNER]), userCtrl.getById);
    app.post('/users/assign-roles', requireAuth([UserRole.ADMIN, UserRole.OWNER]), userCtrl.assignRoles);
    app.post('/users/:id/add-role', requireAuth([UserRole.ADMIN, UserRole.OWNER]), userCtrl.addRole);
    app.post('/users/:id/remove-role', requireAuth([UserRole.ADMIN, UserRole.OWNER]), userCtrl.removeRole);
    app.post('/users/:id/activate', requireAuth([UserRole.ADMIN, UserRole.OWNER]), userCtrl.activate);
    app.post('/users/:id/deactivate', requireAuth([UserRole.ADMIN, UserRole.OWNER]), userCtrl.deactivate);
}
