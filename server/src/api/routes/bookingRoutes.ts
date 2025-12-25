import { Express } from 'express';
import { BookingController } from '../controllers/BookingController';
import { requireAuth } from '../../middleware/requireAuth';
import { auditLogger } from '../../middleware/auditLogger';

export function registerBookingRoutes(app: Express) {
    const bookingCtrl = new BookingController();

    // Booking routes (protected)
    app.post('/bookings', requireAuth(), auditLogger('bookings'), bookingCtrl.create.bind(bookingCtrl));
    app.get('/bookings', requireAuth(), bookingCtrl.getAll.bind(bookingCtrl));
    app.get('/bookings/search', requireAuth(), bookingCtrl.search.bind(bookingCtrl));
    app.get('/bookings/filter', requireAuth(), bookingCtrl.filter.bind(bookingCtrl));
    app.get('/bookings/upcoming', requireAuth(), bookingCtrl.getUpcoming.bind(bookingCtrl));
    app.get('/bookings/overdue', requireAuth(), bookingCtrl.getOverdue.bind(bookingCtrl));
    app.get('/bookings/revenue-stats', requireAuth(), bookingCtrl.getRevenueStats.bind(bookingCtrl));
    app.get('/bookings/stats', requireAuth(), bookingCtrl.getStats.bind(bookingCtrl));
    app.get('/bookings/travel-dates', requireAuth(), bookingCtrl.getByTravelDates.bind(bookingCtrl));
    //app.get('/bookings/customer/:customerId', requireAuth(), bookingCtrl.getByCustomerId);
    app.get('/bookings/:id', requireAuth(), auditLogger('bookings'), bookingCtrl.getById.bind(bookingCtrl));
    app.put('/bookings/:id', requireAuth(), auditLogger('bookings'), bookingCtrl.update.bind(bookingCtrl));
    //app.patch('/bookings/:id/payment', requireAuth(), auditLogger('bookings'), bookingCtrl.updatePayment);
    app.patch('/bookings/:id/status', requireAuth(), auditLogger('bookings'), bookingCtrl.updateStatus.bind(bookingCtrl));
    app.patch('/bookings/:id/cancel', requireAuth(), auditLogger('bookings'), bookingCtrl.cancel.bind(bookingCtrl));
    app.patch('/bookings/:id/confirm', requireAuth(), auditLogger('bookings'), bookingCtrl.confirm.bind(bookingCtrl));
    app.patch('/bookings/:id/complete', requireAuth(), auditLogger('bookings'), bookingCtrl.complete.bind(bookingCtrl));
    app.delete('/bookings/:id', requireAuth(), auditLogger('bookings'), bookingCtrl.delete.bind(bookingCtrl));
    //app.patch('/bookings/:id/archive', requireAuth(), auditLogger('bookings'), bookingCtrl.archive);
}
