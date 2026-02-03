import { Express } from 'express';
import multer from 'multer';
import { CustomerController } from '../controllers/CustomerController';
import { requireAuth } from '../../middleware/requireAuth';
import { auditLogger } from '../../middleware/auditLogger';

// Configure multer for CSV uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for CSV files
  },
  fileFilter: (req, file, cb) => {
    // Only accept CSV files
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  }
});

export function registerCustomerRoutes(app: Express) {
    const customerCtrl = new CustomerController();

    // Customer routes (protected)
    app.post('/customers', requireAuth(), auditLogger('customers'), customerCtrl.create);
    app.post('/customers/import', requireAuth(), upload.single('file'), auditLogger('customers'), customerCtrl.bulkImport);
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
