import { injectable, inject } from 'tsyringe';
import { IBookingRepository } from '../../repositories/IBookingRepository';
import { ICustomerRepository } from '../../repositories/ICustomerRepository';
import { Booking } from '../../../domain/Booking';

export interface BookingSearchParams {
  q?: string;
  customerId?: string;
  customerName?: string;
  bookingDate?: Date;
  travelStartAt?: Date;
  travelEndAt?: Date;
  packageName?: string;
  pnrNo?: string;
  modeOfJourney?: string;
  primaryPaxName?: string;
  limit?: number;
  offset?: number;
}

@injectable()
export class GetBookings {
  constructor(
    @inject('IBookingRepository') private bookingRepo: IBookingRepository,
    @inject('ICustomerRepository') private customerRepo: ICustomerRepository
  ) {}

  async execute(orgId: string, limit?: number, offset?: number): Promise<Booking[]> {
    return await this.bookingRepo.findAll(orgId, limit, offset);
  }

  async search(params: BookingSearchParams, orgId: string): Promise<Booking[]> {
    // If customerName is provided or q might match customer names,
    // first search customers to get matching IDs
    let customerIds: string[] | undefined;
    
    if (params.customerName) {
      // Search customers by name
      const customers = await this.customerRepo.search(params.customerName, orgId, 100);
      customerIds = customers.map(c => c.id);
      
      // If no customers match, return empty results
      if (customerIds.length === 0) {
        return [];
      }
    }
    
    // For general search (q parameter), also search customer names
    // and merge with other search results
    if (params.q && !params.customerName) {
      const customers = await this.customerRepo.search(params.q, orgId, 100);
      if (customers.length > 0) {
        customerIds = customers.map(c => c.id);
      }
    }
    
    return await this.bookingRepo.search(params, orgId, customerIds);
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
