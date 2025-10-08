import { Express } from 'express';
import { registerAuthRoutes } from './routes/authRoutes';
import { registerCustomerRoutes } from './routes/customerRoutes';
import { registerVendorRoutes } from './routes/vendorRoutes';
import { registerBookingRoutes } from './routes/bookingRoutes';
import { registerPaymentRoutes } from './routes/paymentRoutes';
import { registerAuditLogRoutes } from './routes/auditLogRoutes';
import { registerUserRoutes } from './routes/userRoutes';
import { registerAccountRoutes } from './routes/accountRoutes';
import { registerFileRoutes } from './routes/fileRoutes';
import { registerOCRRoutes } from './routes/ocrRoutes';

export function registerRoutes(app: Express) {
    registerAuthRoutes(app);
    registerCustomerRoutes(app);
    registerVendorRoutes(app);
    registerBookingRoutes(app);
    registerPaymentRoutes(app);
    registerAuditLogRoutes(app);
    registerUserRoutes(app);
    registerAccountRoutes(app);
    registerFileRoutes(app);
    registerOCRRoutes(app);
}
