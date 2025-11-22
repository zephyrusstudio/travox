import { injectable, inject } from 'tsyringe';
import { IBookingRepository } from '../../repositories/IBookingRepository';
import { Booking } from '../../../domain/Booking';
import { BookingStatus } from '../../../models/FirestoreTypes';

interface GetBookingsFilters {
  customerId?: string;
  status?: BookingStatus;
  startDate?: Date;
  endDate?: Date;
  pnr?: string;
  limit?: number;
  offset?: number;
}

@injectable()
export class GetBookings {
  constructor(
    @inject('IBookingRepository') private bookingRepo: IBookingRepository
  ) {}

  async execute(filters: GetBookingsFilters, orgId: string): Promise<Booking[]> {
    // If PNR is provided, search by PNR specifically
    if (filters.pnr) {
      const booking = await this.bookingRepo.findByPNR(filters.pnr, orgId);
      return booking ? [booking] : [];
    }

    // If customer ID is provided, filter by customer
    if (filters.customerId) {
      return await this.bookingRepo.findByCustomerId(filters.customerId, orgId);
    }

    // If status is provided, filter by status
    if (filters.status) {
      return await this.bookingRepo.findByStatus(filters.status, orgId);
    }

    // If date range is provided, filter by date range
    if (filters.startDate && filters.endDate) {
      return await this.bookingRepo.findByDateRange(filters.startDate, filters.endDate, orgId);
    }

    // Otherwise, get all bookings
    return await this.bookingRepo.findAll(orgId, filters.limit, filters.offset);
  }

  async count(orgId: string): Promise<number> {
    return await this.bookingRepo.countAll(orgId);
  }

  async getById(bookingId: string, orgId: string): Promise<Booking | null> {
    return await this.bookingRepo.findById(bookingId, orgId);
  }

  async getByCustomerId(customerId: string, orgId: string): Promise<Booking[]> {
    return await this.bookingRepo.findByCustomerId(customerId, orgId);
  }

  async getUpcoming(orgId: string, days?: number): Promise<Booking[]> {
    return await this.bookingRepo.getUpcomingBookings(orgId, days);
  }

  async getByTravelDates(startDate: Date, endDate: Date, orgId: string): Promise<Booking[]> {
    return await this.bookingRepo.getBookingsByTravelDates(startDate, endDate, orgId);
  }

  async getOverdue(orgId: string): Promise<Booking[]> {
    return await this.bookingRepo.getOverdueBookings(orgId);
  }

  async getRevenueStats(orgId: string, startDate?: Date, endDate?: Date): Promise<{
    totalRevenue: number;
    paidAmount: number;
    dueAmount: number;
    bookingCount: number;
  }> {
    return await this.bookingRepo.getRevenueStats(orgId, startDate, endDate);
  }
}
