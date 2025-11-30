import { injectable, inject } from 'tsyringe';
import { IBookingRepository } from '../../repositories/IBookingRepository';
import { ICustomerRepository } from '../../repositories/ICustomerRepository';
import { RedisService } from '../../../infrastructure/services/RedisService';
import { Booking } from '../../../domain/Booking';
import { BookingStatus } from '../../../models/FirestoreTypes';

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
    const cacheKey = `report:customers:bookings:${orgId}:${startDate.toISOString()}:${endDate.toISOString()}:pending=${pendingOnly}`;

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
          travelEndAt: b.travelEndAt ? new Date(b.travelEndAt) : undefined
        }))
      }));
    }

    // Fetch bookings within the date range
    const bookings = await this.bookingRepo.findByDateRange(startDate, endDate, orgId);

    // Filter out cancelled/refunded bookings, and optionally filter by pending payments
    const filteredBookings = bookings.filter(booking => {
      // Always exclude cancelled and refunded
      if (booking.status === BookingStatus.CANCELLED || booking.status === BookingStatus.REFUNDED) {
        return false;
      }
      // If pendingOnly, only include bookings with due amount > 0
      if (pendingOnly && booking.dueAmount <= 0) {
        return false;
      }
      return true;
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
      const totalAmount = customerBookings.reduce((sum, b) => sum + b.totalAmount, 0);
      const totalPaid = customerBookings.reduce((sum, b) => sum + b.paidAmount, 0);
      const totalDue = customerBookings.reduce((sum, b) => sum + b.dueAmount, 0);

      reports.push({
        customer: {
          id: customer.id,
          name: customer.name,
          phone: customer.phone,
          email: customer.email
        },
        bookings: customerBookings.map(b => ({
          id: b.id,
          packageName: b.packageName,
          primaryPaxName: b.primaryPaxName,
          bookingDate: b.bookingDate,
          totalAmount: b.totalAmount,
          paidAmount: b.paidAmount,
          dueAmount: b.dueAmount,
          status: b.status,
          travelStartAt: b.travelStartAt,
          travelEndAt: b.travelEndAt
        })),
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
}
