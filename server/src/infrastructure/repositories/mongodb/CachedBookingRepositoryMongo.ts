import { injectable, inject } from 'tsyringe';
import { IBookingRepository } from '../../../application/repositories/IBookingRepository';
import { Booking } from '../../../domain/Booking';
import { BookingRepositoryMongo } from './BookingRepositoryMongo';
import { RedisService } from '../../services/RedisService';
import { BookingStatus } from '../../../models/FirestoreTypes';
import { BookingSearchParams, BookingFilterParams } from '../../../application/useCases/booking/GetBookings';

const COLLECTION_NAME = 'bookings';
const ENTITY_TTL = 300; // 5 minutes
const LIST_TTL = 600; // 10 minutes
const STATS_TTL = 120; // 2 minutes

@injectable()
export class CachedBookingRepositoryMongo implements IBookingRepository {
  constructor(
    @inject('BookingRepositoryMongo') private baseRepo: BookingRepositoryMongo,
    @inject('RedisService') private cache: RedisService
  ) {}

  async create(booking: Booking, orgId: string): Promise<Booking> {
    const result = await this.baseRepo.create(booking, orgId);
    await this.cache.invalidatePattern(`${COLLECTION_NAME}:${orgId}:*`);
    return result;
  }

  async findById(id: string, orgId: string): Promise<Booking | null> {
    const cacheKey = this.cache.generateKey(COLLECTION_NAME, orgId, id);
    
    const cached = await this.cache.get<Booking>(cacheKey);
    if (cached) {
      // Booking has complex nested structure, fetch fresh for now
      // Could implement rehydration if needed
    }

    const booking = await this.baseRepo.findById(id, orgId);
    
    if (booking) {
      await this.cache.set(cacheKey, booking, ENTITY_TTL);
    }
    
    return booking;
  }

  async findByCustomerId(customerId: string, orgId: string): Promise<Booking[]> {
    return this.baseRepo.findByCustomerId(customerId, orgId);
  }

  async findByPNR(pnr: string, orgId: string): Promise<Booking | null> {
    return this.baseRepo.findByPNR(pnr, orgId);
  }

  async findByStatus(status: BookingStatus, orgId: string): Promise<Booking[]> {
    return this.baseRepo.findByStatus(status, orgId);
  }

  async findByDateRange(startDate: Date, endDate: Date, orgId: string): Promise<Booking[]> {
    return this.baseRepo.findByDateRange(startDate, endDate, orgId);
  }

  async findAll(orgId: string, limit?: number, offset?: number): Promise<Booking[]> {
    return this.baseRepo.findAll(orgId, limit, offset);
  }

  async countAll(orgId: string): Promise<number> {
    const cacheKey = `${COLLECTION_NAME}:${orgId}:count`;
    
    const cached = await this.cache.get<number>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    const count = await this.baseRepo.countAll(orgId);
    await this.cache.set(cacheKey, count, STATS_TTL);
    
    return count;
  }

  async update(booking: Booking, orgId: string): Promise<Booking> {
    const result = await this.baseRepo.update(booking, orgId);
    await this.invalidateCacheForBooking(booking.id, orgId);
    return result;
  }

  async updateFields(id: string, fields: Record<string, any>, orgId: string): Promise<boolean> {
    const result = await this.baseRepo.updateFields(id, fields, orgId);
    if (result) {
      await this.invalidateCacheForBooking(id, orgId);
    }
    return result;
  }

  async softDelete(id: string, orgId: string, updatedBy: string): Promise<boolean> {
    const result = await this.baseRepo.softDelete(id, orgId, updatedBy);
    if (result) {
      await this.invalidateCacheForBooking(id, orgId);
    }
    return result;
  }

  async archive(id: string, orgId: string, updatedBy: string): Promise<boolean> {
    const result = await this.baseRepo.archive(id, orgId, updatedBy);
    if (result) {
      await this.invalidateCacheForBooking(id, orgId);
    }
    return result;
  }

  async search(params: BookingSearchParams, orgId: string, matchingCustomerIds?: string[]): Promise<Booking[]> {
    return this.baseRepo.search(params, orgId, matchingCustomerIds);
  }

  async filter(params: BookingFilterParams, orgId: string): Promise<Booking[]> {
    return this.baseRepo.filter(params, orgId);
  }

  async getUpcomingBookings(orgId: string, days?: number): Promise<Booking[]> {
    return this.baseRepo.getUpcomingBookings(orgId, days);
  }

  async getBookingsByTravelDates(startDate: Date, endDate: Date, orgId: string): Promise<Booking[]> {
    return this.baseRepo.getBookingsByTravelDates(startDate, endDate, orgId);
  }

  async getRevenueStats(orgId: string, startDate?: Date, endDate?: Date): Promise<{
    totalRevenue: number;
    paidAmount: number;
    dueAmount: number;
    bookingCount: number;
  }> {
    const cacheKey = `${COLLECTION_NAME}:${orgId}:stats:revenue:${startDate?.toISOString() || 'all'}:${endDate?.toISOString() || 'all'}`;
    
    const cached = await this.cache.get<any>(cacheKey);
    if (cached) {
      return cached;
    }

    const stats = await this.baseRepo.getRevenueStats(orgId, startDate, endDate);
    await this.cache.set(cacheKey, stats, STATS_TTL);
    
    return stats;
  }

  async getStats(orgId: string): Promise<{
    totalBookings: number;
    confirmedBookings: number;
    totalRevenue: number;
    revenueForecast: number;
    pendingAmount: number;
  }> {
    const cacheKey = `${COLLECTION_NAME}:${orgId}:stats:overview`;
    
    const cached = await this.cache.get<any>(cacheKey);
    if (cached) {
      return cached;
    }

    const stats = await this.baseRepo.getStats(orgId);
    await this.cache.set(cacheKey, stats, STATS_TTL);
    
    return stats;
  }

  async updatePayment(bookingId: string, paidAmount: number, orgId: string, updatedBy: string): Promise<boolean> {
    const result = await this.baseRepo.updatePayment(bookingId, paidAmount, orgId, updatedBy);
    if (result) {
      await this.invalidateCacheForBooking(bookingId, orgId);
    }
    return result;
  }

  async getOverdueBookings(orgId: string): Promise<Booking[]> {
    return this.baseRepo.getOverdueBookings(orgId);
  }

  async invalidateCacheForBooking(bookingId: string, orgId: string): Promise<void> {
    const entityKey = this.cache.generateKey(COLLECTION_NAME, orgId, bookingId);
    await this.cache.delete(entityKey);
    await this.cache.invalidatePattern(`${COLLECTION_NAME}:${orgId}:list*`);
    await this.cache.invalidatePattern(`${COLLECTION_NAME}:${orgId}:count*`);
    await this.cache.invalidatePattern(`${COLLECTION_NAME}:${orgId}:stats*`);
  }
}
