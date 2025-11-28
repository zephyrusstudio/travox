import { injectable, inject } from 'tsyringe';
import { IBookingRepository } from '../../application/repositories/IBookingRepository';
import { Booking } from '../../domain/Booking';
import { BookingPax } from '../../domain/BookingPax';
import { BookingItinerary } from '../../domain/BookingItinerary';
import { BookingSegment } from '../../domain/BookingSegment';
import { BookingStatus } from '../../models/FirestoreTypes';
import { BookingRepositoryFirestore } from './BookingRepositoryFirestore';
import { RedisService } from '../services/RedisService';
import { rehydrateObject, COMMON_DATE_FIELDS } from '../../utils/cacheRehydration';
import { BookingSearchParams } from '../../application/useCases/booking/GetBookings';

const COLLECTION_NAME = 'bookings';
const ENTITY_TTL = 300; // 5 minutes
const LIST_TTL = 900; // 15 minutes
const STATS_TTL = 120; // 2 minutes

@injectable()
export class CachedBookingRepository implements IBookingRepository {
  constructor(
    @inject('BookingRepositoryFirestore') private baseRepo: BookingRepositoryFirestore,
    @inject('RedisService') private cache: RedisService
  ) {}

  async create(booking: Booking, orgId: string): Promise<Booking> {
    const result = await this.baseRepo.create(booking, orgId);
    
    // Invalidate list caches
    await this.cache.invalidatePattern(`${COLLECTION_NAME}:${orgId}:list*`);
    await this.cache.invalidatePattern(`${COLLECTION_NAME}:${orgId}:stats*`);
    
    return result;
  }

  async findById(id: string, orgId: string): Promise<Booking | null> {
    const cacheKey = this.cache.generateKey(COLLECTION_NAME, orgId, id);
    
    const cached = await this.cache.get<Booking>(cacheKey);
    if (cached) {
      return this.rehydrateBooking(cached);
    }

    const booking = await this.baseRepo.findById(id, orgId);
    
    if (booking) {
      await this.cache.set(cacheKey, booking, ENTITY_TTL);
    }
    
    return booking;
  }

  async findByCustomerId(customerId: string, orgId: string): Promise<Booking[]> {
    const cacheKey = `${COLLECTION_NAME}:${orgId}:customer:${customerId}`;
    
    const cached = await this.cache.get<Booking[]>(cacheKey);
    if (cached) {
      return cached.map(b => this.rehydrateBooking(b));
    }

    const bookings = await this.baseRepo.findByCustomerId(customerId, orgId);
    
    if (bookings.length > 0) {
      await this.cache.set(cacheKey, bookings, LIST_TTL);
    }
    
    return bookings;
  }

  async findByPNR(pnr: string, orgId: string): Promise<Booking | null> {
    const cacheKey = `${COLLECTION_NAME}:${orgId}:pnr:${pnr}`;
    
    const cached = await this.cache.get<Booking>(cacheKey);
    if (cached) {
      return this.rehydrateBooking(cached);
    }

    const booking = await this.baseRepo.findByPNR(pnr, orgId);
    
    if (booking) {
      await this.cache.set(cacheKey, booking, ENTITY_TTL);
    }
    
    return booking;
  }

  async findByStatus(status: BookingStatus, orgId: string): Promise<Booking[]> {
    const cacheKey = `${COLLECTION_NAME}:${orgId}:status:${status}`;
    
    const cached = await this.cache.get<Booking[]>(cacheKey);
    if (cached) {
      return cached.map(b => this.rehydrateBooking(b));
    }

    const bookings = await this.baseRepo.findByStatus(status, orgId);
    
    if (bookings.length > 0) {
      await this.cache.set(cacheKey, bookings, LIST_TTL);
    }
    
    return bookings;
  }

  async findByDateRange(startDate: Date, endDate: Date, orgId: string): Promise<Booking[]> {
    const cacheKey = `${COLLECTION_NAME}:${orgId}:daterange:${startDate.toISOString()}:${endDate.toISOString()}`;
    
    const cached = await this.cache.get<Booking[]>(cacheKey);
    if (cached) {
      return cached.map(b => this.rehydrateBooking(b));
    }

    const bookings = await this.baseRepo.findByDateRange(startDate, endDate, orgId);
    
    if (bookings.length > 0) {
      await this.cache.set(cacheKey, bookings, LIST_TTL);
    }
    
    return bookings;
  }

  async findAll(orgId: string, limit?: number, offset?: number): Promise<Booking[]> {
    const cacheKey = this.cache.generateListKey(COLLECTION_NAME, orgId, { limit, offset });
    
    const cached = await this.cache.get<Booking[]>(cacheKey);
    if (cached) {
      return cached.map(b => this.rehydrateBooking(b));
    }

    const bookings = await this.baseRepo.findAll(orgId, limit, offset);
    
    if (bookings.length > 0) {
      await this.cache.set(cacheKey, bookings, LIST_TTL);
    }
    
    return bookings;
  }

  async countAll(orgId: string): Promise<number> {
    const cacheKey = `${COLLECTION_NAME}:${orgId}:count:all`;
    
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
    
    await this.invalidateBookingCache(booking.id, orgId);
    
    return result;
  }

  async updateFields(id: string, fields: Record<string, any>, orgId: string): Promise<boolean> {
    const result = await this.baseRepo.updateFields(id, fields, orgId);
    
    if (result) {
      await this.invalidateBookingCache(id, orgId);
    }
    
    return result;
  }

  async softDelete(id: string, orgId: string, updatedBy: string): Promise<boolean> {
    const result = await this.baseRepo.softDelete(id, orgId, updatedBy);
    
    if (result) {
      await this.invalidateBookingCache(id, orgId);
    }
    
    return result;
  }

  async archive(id: string, orgId: string, updatedBy: string): Promise<boolean> {
    const result = await this.baseRepo.archive(id, orgId, updatedBy);
    
    if (result) {
      await this.invalidateBookingCache(id, orgId);
    }
    
    return result;
  }

  async getUpcomingBookings(orgId: string, days?: number): Promise<Booking[]> {
    const cacheKey = `${COLLECTION_NAME}:${orgId}:upcoming:${days || 30}`;
    
    const cached = await this.cache.get<Booking[]>(cacheKey);
    if (cached) {
      return cached.map(b => this.rehydrateBooking(b));
    }

    const bookings = await this.baseRepo.getUpcomingBookings(orgId, days);
    
    if (bookings.length > 0) {
      await this.cache.set(cacheKey, bookings, LIST_TTL);
    }
    
    return bookings;
  }

  async getBookingsByTravelDates(startDate: Date, endDate: Date, orgId: string): Promise<Booking[]> {
    const cacheKey = `${COLLECTION_NAME}:${orgId}:travel:${startDate.toISOString()}:${endDate.toISOString()}`;
    
    const cached = await this.cache.get<Booking[]>(cacheKey);
    if (cached) {
      return cached.map(b => this.rehydrateBooking(b));
    }

    const bookings = await this.baseRepo.getBookingsByTravelDates(startDate, endDate, orgId);
    
    if (bookings.length > 0) {
      await this.cache.set(cacheKey, bookings, LIST_TTL);
    }
    
    return bookings;
  }

  async getRevenueStats(orgId: string, startDate?: Date, endDate?: Date): Promise<any> {
    const cacheKey = `${COLLECTION_NAME}:${orgId}:revenue:${startDate?.toISOString() || 'all'}:${endDate?.toISOString() || 'all'}`;
    
    const cached = await this.cache.get<any>(cacheKey);
    if (cached) {
      return cached;
    }

    const stats = await this.baseRepo.getRevenueStats(orgId, startDate, endDate);
    
    await this.cache.set(cacheKey, stats, STATS_TTL);
    
    return stats;
  }

  async updatePayment(bookingId: string, paidAmount: number, orgId: string, updatedBy: string): Promise<boolean> {
    const result = await this.baseRepo.updatePayment(bookingId, paidAmount, orgId, updatedBy);
    
    if (result) {
      await this.invalidateBookingCache(bookingId, orgId);
    }
    
    return result;
  }

  async getOverdueBookings(orgId: string): Promise<Booking[]> {
    const cacheKey = `${COLLECTION_NAME}:${orgId}:overdue`;
    
    const cached = await this.cache.get<Booking[]>(cacheKey);
    if (cached) {
      return cached.map(b => this.rehydrateBooking(b));
    }

    const bookings = await this.baseRepo.getOverdueBookings(orgId);
    
    if (bookings.length > 0) {
      await this.cache.set(cacheKey, bookings, STATS_TTL);
    }
    
    return bookings;
  }

  async search(params: BookingSearchParams, orgId: string, matchingCustomerIds?: string[]): Promise<Booking[]> {
    // Search is not cached due to the dynamic nature of search params
    // and the complexity of cache invalidation for search results
    return await this.baseRepo.search(params, orgId, matchingCustomerIds);
  }

  /**
   * Invalidate all caches related to a booking
   */
  private async invalidateBookingCache(id: string, orgId: string): Promise<void> {
    // Invalidate by ID
    const idKey = this.cache.generateKey(COLLECTION_NAME, orgId, id);
    await this.cache.delete(idKey);
    
    // Invalidate list and stats caches
    await this.cache.invalidatePattern(`${COLLECTION_NAME}:${orgId}:list*`);
    await this.cache.invalidatePattern(`${COLLECTION_NAME}:${orgId}:customer:*`);
    await this.cache.invalidatePattern(`${COLLECTION_NAME}:${orgId}:status:*`);
    await this.cache.invalidatePattern(`${COLLECTION_NAME}:${orgId}:daterange:*`);
    await this.cache.invalidatePattern(`${COLLECTION_NAME}:${orgId}:upcoming:*`);
    await this.cache.invalidatePattern(`${COLLECTION_NAME}:${orgId}:travel:*`);
    await this.cache.invalidatePattern(`${COLLECTION_NAME}:${orgId}:revenue:*`);
    await this.cache.invalidatePattern(`${COLLECTION_NAME}:${orgId}:overdue`);
    await this.cache.invalidatePattern(`${COLLECTION_NAME}:${orgId}:count:*`);
    await this.cache.invalidatePattern(`${COLLECTION_NAME}:${orgId}:pnr:*`);
  }

  /**
   * Rehydrate Booking object from cached data
   * IMPORTANT: Must restore prototype chain for nested objects (pax, itineraries, segments)
   * to retain toApiResponse() and other methods
   */
  private rehydrateBooking(data: any): Booking {
    // Rehydrate nested PAX objects with their methods
    const pax = data.pax.map((p: any) =>
      rehydrateObject<BookingPax>(p, BookingPax.prototype, COMMON_DATE_FIELDS.pax)
    );

    // Rehydrate nested itinerary and segment objects
    const itineraries = data.itineraries.map((i: any) => {
      const segments = i.segments.map((s: any) =>
        rehydrateObject<BookingSegment>(s, BookingSegment.prototype, COMMON_DATE_FIELDS.segment)
      );

      const itinerary = rehydrateObject<BookingItinerary>(
        { ...i, segments },
        BookingItinerary.prototype,
        COMMON_DATE_FIELDS.itinerary
      );
      return itinerary;
    });

    // Rehydrate the main booking object
    return rehydrateObject<Booking>(
      { ...data, pax, itineraries },
      Booking.prototype,
      COMMON_DATE_FIELDS.booking
    );
  }
}
