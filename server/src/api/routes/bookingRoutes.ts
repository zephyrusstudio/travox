import { Express } from 'express';
import { BookingController } from '../controllers/BookingController';
import { requireAuth } from '../../middleware/requireAuth';
import { auditLogger } from '../../middleware/auditLogger';

export function registerBookingRoutes(app: Express) {
    const bookingCtrl = new BookingController();

    // Booking routes (protected)
    app.post('/bookings', requireAuth(), auditLogger('bookings'), bookingCtrl.create);
    app.get('/bookings', requireAuth(), bookingCtrl.getAll);
    app.get('/bookings/upcoming', requireAuth(), bookingCtrl.getUpcoming);
    app.get('/bookings/overdue', requireAuth(), bookingCtrl.getOverdue);
    app.get('/bookings/revenue-stats', requireAuth(), bookingCtrl.getRevenueStats);
    app.get('/bookings/travel-dates', requireAuth(), bookingCtrl.getByTravelDates);
    //app.get('/bookings/customer/:customerId', requireAuth(), bookingCtrl.getByCustomerId);
    app.get('/bookings/:id', requireAuth(), auditLogger('bookings'), bookingCtrl.getById);
    app.put('/bookings/:id', requireAuth(), auditLogger('bookings'), bookingCtrl.update);
    //app.patch('/bookings/:id/payment', requireAuth(), auditLogger('bookings'), bookingCtrl.updatePayment);
    app.patch('/bookings/:id/status', requireAuth(), auditLogger('bookings'), bookingCtrl.updateStatus);
    app.patch('/bookings/:id/cancel', requireAuth(), auditLogger('bookings'), bookingCtrl.cancel);
    app.patch('/bookings/:id/confirm', requireAuth(), auditLogger('bookings'), bookingCtrl.confirm);
    app.patch('/bookings/:id/complete', requireAuth(), auditLogger('bookings'), bookingCtrl.complete);
    app.delete('/bookings/:id', requireAuth(), auditLogger('bookings'), bookingCtrl.delete);
    app.get('/bookings/:id/ticket', requireAuth(), bookingCtrl.getBookingTicket);
    //app.patch('/bookings/:id/archive', requireAuth(), auditLogger('bookings'), bookingCtrl.archive);
}
