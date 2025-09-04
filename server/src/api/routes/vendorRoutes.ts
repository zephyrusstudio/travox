import { Express } from 'express';
import { VendorController } from '../controllers/VendorController';
import { requireAuth } from '../../middleware/requireAuth';
import { auditLogger } from '../../middleware/auditLogger';

export function registerVendorRoutes(app: Express) {
    const vendorCtrl = new VendorController();

    // Vendor routes (protected)
    app.post('/vendors', requireAuth(), auditLogger('vendors'), vendorCtrl.create);
    app.get('/vendors', requireAuth(), vendorCtrl.getAll);
    app.get('/vendors/search', requireAuth(), vendorCtrl.search);
    app.get('/vendors/:id', requireAuth(), auditLogger('vendors'), vendorCtrl.getById);
    app.put('/vendors/:id', requireAuth(), auditLogger('vendors'), vendorCtrl.update);
    app.get('/vendors/:id/stats', requireAuth(), vendorCtrl.getStats);
    app.delete('/vendors/:id', requireAuth(), auditLogger('vendors'), vendorCtrl.delete);
}
