import { injectable, inject } from 'tsyringe';
import { IBookingRepository } from '../../repositories/IBookingRepository';
import { ICustomerRepository } from '../../repositories/ICustomerRepository';
import { IPaymentRepository } from '../../repositories/IPaymentRepository';
import { RedisService } from '../../../infrastructure/services/RedisService';
import { Booking } from '../../../domain/Booking';
import { BookingStatus, PaymentType } from '../../../models/FirestoreTypes';

type PaymentDirection = 'IN' | 'OUT';

export interface CustomerBookingsReport {
  customer: {
    id: string;
    name: string;
    phone?: string;
    email?: string;
  };
  bookings: {
    id: string;
    packageName?: string;
    primaryPaxName?: string;
    bookingDate: Date;
    totalAmount: number;
    paidAmount: number;
    dueAmount: number;
    status: BookingStatus;
    travelStartAt?: Date;
    travelEndAt?: Date;
    payments: {
      id: string;
      paymentType: PaymentType;
      direction: PaymentDirection;
      amount: number;
      paymentMode: string;
      createdAt: Date;
      receiptNo?: string;
      notes?: string;
    }[];
    paymentCount: number;
    paymentModeBreakdown: {
      paymentMode: string;
      amount: number;
      count: number;
    }[];
  }[];
  totalAmount: number;
  totalPaid: number;
  totalDue: number;
  bookingCount: number;
}

const REPORT_CACHE_TTL = 300; // 5 minutes

@injectable()
export class GetCustomerPendingPaymentsReport {
  constructor(
    @inject('IBookingRepository') private bookingRepo: IBookingRepository,
    @inject('ICustomerRepository') private customerRepo: ICustomerRepository,
    @inject('IPaymentRepository') private paymentRepo: IPaymentRepository,
    @inject('RedisService') private cache: RedisService
  ) {}

  /**
   * Get customers with their bookings within a date interval
   * The interval is based on booking date
   * @param pendingOnly - If true, only include bookings with pending payments (dueAmount > 0)
   */
  async execute(
    startDate: Date,
    endDate: Date,
    orgId: string,
    pendingOnly: boolean = false
  ): Promise<CustomerBookingsReport[]> {
    // Generate cache key based on date range and pending filter
    const cacheKey = `report:customers:bookings:${orgId}:${startDate.toISOString()}:${endDate.toISOString()}:pending=${pendingOnly}:v2`;

    // Try to get from cache first
    const cached = await this.cache.get<CustomerBookingsReport[]>(cacheKey);
    if (cached) {
      // Rehydrate dates from cached data
      return cached.map(report => ({
        ...report,
        bookings: report.bookings.map(b => ({
          ...b,
          bookingDate: new Date(b.bookingDate),
          travelStartAt: b.travelStartAt ? new Date(b.travelStartAt) : undefined,
          travelEndAt: b.travelEndAt ? new Date(b.travelEndAt) : undefined,
          payments: (b.payments || []).map(p => ({
            ...p,
            createdAt: new Date(p.createdAt)
          }))
        }))
      }));
    }

    // Fetch bookings within the date range
    const bookings = await this.bookingRepo.findByDateRange(startDate, endDate, orgId);

    // Filter out cancelled/refunded bookings before loading payment history.
    const activeBookings = bookings.filter(booking => (
      booking.status !== BookingStatus.CANCELLED &&
      booking.status !== BookingStatus.REFUNDED
    ));

    const activeBookingIds = activeBookings.map(b => b.id);
    const relevantPayments = activeBookingIds.length
      ? await this.paymentRepo.findByBookingIds(
          activeBookingIds,
          orgId,
          [PaymentType.RECEIVABLE, PaymentType.REFUND_OUTBOUND]
        )
      : [];

    const paymentsByBooking = new Map<string, typeof relevantPayments>();
    for (const payment of relevantPayments) {
      if (!payment.bookingId) continue;
      const existing = paymentsByBooking.get(payment.bookingId) || [];
      existing.push(payment);
      paymentsByBooking.set(payment.bookingId, existing);
    }

    const filteredBookings = activeBookings.filter(booking => {
      if (!pendingOnly) return true;
      const financials = this.getBookingFinancials(booking, paymentsByBooking.get(booking.id) || []);
      return financials.dueAmount > 0;
    });

    // Group bookings by customer ID
    const bookingsByCustomer = new Map<string, Booking[]>();
    for (const booking of filteredBookings) {
      const existing = bookingsByCustomer.get(booking.customerId) || [];
      existing.push(booking);
      bookingsByCustomer.set(booking.customerId, existing);
    }

    // Get unique customer IDs
    const customerIds = Array.from(bookingsByCustomer.keys());

    if (customerIds.length === 0) {
      return [];
    }

    // Fetch all customers in parallel (will use cached data where available)
    const customerPromises = customerIds.map(id => this.customerRepo.findById(id, orgId));
    const customers = await Promise.all(customerPromises);

    // Build the report
    const reports: CustomerBookingsReport[] = [];

    for (const customer of customers) {
      if (!customer) continue;

      const customerBookings = bookingsByCustomer.get(customer.id) || [];
      const bookingReports = customerBookings.map(b => {
          const bookingPayments = (paymentsByBooking.get(b.id) || []).sort(
            (left, right) => right.createdAt.getTime() - left.createdAt.getTime()
          );
          const financials = this.getBookingFinancials(b, bookingPayments);

          const paymentModeAccumulator = new Map<string, { paymentMode: string; amount: number; count: number }>();
          for (const payment of bookingPayments) {
            const paymentMode = payment.paymentMode;
            const existing = paymentModeAccumulator.get(paymentMode) || {
              paymentMode,
              amount: 0,
              count: 0
            };
            existing.count += 1;
            existing.amount += payment.paymentType === PaymentType.RECEIVABLE
              ? payment.amount
              : -payment.amount;
            paymentModeAccumulator.set(paymentMode, existing);
          }

          const payments = bookingPayments.map(payment => ({
            id: payment.id,
            paymentType: payment.paymentType,
            direction: payment.paymentType === PaymentType.RECEIVABLE ? 'IN' as const : 'OUT' as const,
            amount: payment.amount,
            paymentMode: payment.paymentMode,
            createdAt: payment.createdAt,
            receiptNo: payment.receiptNo,
            notes: payment.notes
          }));

          return {
            id: b.id,
            packageName: b.packageName,
            primaryPaxName: b.primaryPaxName,
            bookingDate: b.bookingDate,
            totalAmount: b.totalAmount,
            paidAmount: financials.paidAmount,
            dueAmount: financials.dueAmount,
            status: b.status,
            travelStartAt: b.travelStartAt,
            travelEndAt: b.travelEndAt,
            payments,
            paymentCount: payments.filter(p => p.direction === 'IN').length,
            paymentModeBreakdown: Array.from(paymentModeAccumulator.values())
          };
        });

      const totalAmount = bookingReports.reduce((sum, b) => sum + b.totalAmount, 0);
      const totalPaid = bookingReports.reduce((sum, b) => sum + b.paidAmount, 0);
      const totalDue = bookingReports.reduce((sum, b) => sum + b.dueAmount, 0);

      reports.push({
        customer: {
          id: customer.id,
          name: customer.name,
          phone: customer.phone,
          email: customer.email
        },
        bookings: bookingReports,
        totalAmount,
        totalPaid,
        totalDue,
        bookingCount: customerBookings.length
      });
    }

    // Sort by total amount descending (or by totalDue if pendingOnly)
    if (pendingOnly) {
      reports.sort((a, b) => b.totalDue - a.totalDue);
    } else {
      reports.sort((a, b) => b.totalAmount - a.totalAmount);
    }

    // Cache the result
    await this.cache.set(cacheKey, reports, REPORT_CACHE_TTL);

    return reports;
  }

  private getBookingFinancials(booking: Booking, payments: Awaited<ReturnType<IPaymentRepository['findByBookingIds']>>): {
    paidAmount: number;
    dueAmount: number;
  } {
    if (booking.status === BookingStatus.CANCELLED || booking.status === BookingStatus.REFUNDED) {
      return {
        paidAmount: booking.status === BookingStatus.REFUNDED ? 0 : this.round(Math.max(0, Number(booking.paidAmount || 0))),
        dueAmount: 0,
      };
    }

    const receivableTotal = payments
      .filter(payment => payment.paymentType === PaymentType.RECEIVABLE)
      .reduce((sum, payment) => sum + payment.amount, 0);
    const refundTotal = payments
      .filter(payment => payment.paymentType === PaymentType.REFUND_OUTBOUND)
      .reduce((sum, payment) => sum + payment.amount, 0);
    const storedPaidAmount = Math.max(0, Number(booking.paidAmount || 0));
    const grossPaidFromStored = storedPaidAmount > receivableTotal
      ? storedPaidAmount + refundTotal
      : storedPaidAmount;
    const grossPaidAmount = this.round(Math.max(receivableTotal, grossPaidFromStored));
    const paidAmount = this.round(Math.max(0, grossPaidAmount - refundTotal));
    const dueAmount = this.round(Math.max(0, booking.totalAmount - grossPaidAmount));

    return { paidAmount, dueAmount };
  }

  private round(value: number): number {
    return Number(value.toFixed(2));
  }
}
