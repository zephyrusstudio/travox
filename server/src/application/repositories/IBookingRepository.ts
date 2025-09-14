import { Booking } from '../../domain/Booking';
import { BookingStatus } from '../../models/FirestoreTypes';

export interface IBookingRepository {
  create(booking: Booking, orgId: string): Promise<Booking>;
  findById(id: string, orgId: string): Promise<Booking | null>;
  findByCustomerId(customerId: string, orgId: string): Promise<Booking[]>;
  findByPNR(pnr: string, orgId: string): Promise<Booking | null>;
  findByStatus(status: BookingStatus, orgId: string): Promise<Booking[]>;
  findByDateRange(startDate: Date, endDate: Date, orgId: string): Promise<Booking[]>;
  findAll(orgId: string, limit?: number): Promise<Booking[]>;
  update(booking: Booking, orgId: string): Promise<Booking>;
  updateFields(id: string, fields: Record<string, any>, orgId: string): Promise<boolean>;
  softDelete(id: string, orgId: string, updatedBy: string): Promise<boolean>;
  archive(id: string, orgId: string, updatedBy: string): Promise<boolean>;
  
  // Business-specific methods
  getUpcomingBookings(orgId: string, days?: number): Promise<Booking[]>;
  getBookingsByTravelDates(startDate: Date, endDate: Date, orgId: string): Promise<Booking[]>;
  getRevenueStats(orgId: string, startDate?: Date, endDate?: Date): Promise<{
    totalRevenue: number;
    paidAmount: number;
    dueAmount: number;
    bookingCount: number;
  }>;
  
  // Payment related
  updatePayment(bookingId: string, paidAmount: number, orgId: string, updatedBy: string): Promise<boolean>;
  getOverdueBookings(orgId: string): Promise<Booking[]>;
}
