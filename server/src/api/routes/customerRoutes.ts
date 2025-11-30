import { Express } from 'express';
import { CustomerController } from '../controllers/CustomerController';
import { requireAuth } from '../../middleware/requireAuth';
import { auditLogger } from '../../middleware/auditLogger';

export function registerCustomerRoutes(app: Express) {
    const customerCtrl = new CustomerController();

    // Customer routes (protected)
    app.post('/customers', requireAuth(), auditLogger('customers'), customerCtrl.create);
    app.get('/customers', requireAuth(), customerCtrl.getAll);
    app.get('/customers/search', requireAuth(), customerCtrl.search);
    app.get('/customers/report', requireAuth(), customerCtrl.getBookingsReport);
    app.get('/customers/:id', requireAuth(), auditLogger('customers'), customerCtrl.getById);
    app.put('/customers/:id', requireAuth(), auditLogger('customers'), customerCtrl.update);
    app.get('/customers/:id/stats', requireAuth(), customerCtrl.getStats);
    app.get('/customers/:id/bookings', requireAuth(), customerCtrl.listBookings);
    app.get('/customers/:id/account', requireAuth(), customerCtrl.getAccount);
    app.delete('/customers/:id', requireAuth(), auditLogger('customers'), customerCtrl.delete);
}
