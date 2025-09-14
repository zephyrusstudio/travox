import { Express } from 'express';
import { PaymentController } from '../controllers/PaymentController';
import { requireAuth } from '../../middleware/requireAuth';
import { auditLogger } from '../../middleware/auditLogger';

export function registerPaymentRoutes(app: Express) {
    const paymentCtrl = new PaymentController();

    // Payment routes (protected)
    app.post('/payments/receivable', requireAuth(), auditLogger('payments'), paymentCtrl.createReceivable);
    app.post('/payments/expense', requireAuth(), auditLogger('payments'), paymentCtrl.createExpense);
    app.post('/payments/inbound-refund', requireAuth(), auditLogger('payments'), paymentCtrl.createInboundRefund);
    app.post('/payments/outbound-refund', requireAuth(), auditLogger('payments'), paymentCtrl.createOutboundRefund);
    app.get('/payments', requireAuth(), paymentCtrl.getPayments);
    app.get('/payments/:id', requireAuth(), paymentCtrl.getPaymentById);
}
