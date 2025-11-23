import { injectable, inject } from 'tsyringe';
import { IPaymentRepository } from '../../application/repositories/IPaymentRepository';
import { Payment } from '../../domain/Payment';
import { PaymentType } from '../../models/FirestoreTypes';
import { PaymentRepositoryFirestore } from './PaymentRepositoryFirestore';
import { RedisService } from '../services/RedisService';
import { rehydrateObject, COMMON_DATE_FIELDS } from '../../utils/cacheRehydration';

const COLLECTION_NAME = 'payments';
const ENTITY_TTL = 300; // 5 minutes
const LIST_TTL = 900; // 15 minutes
const STATS_TTL = 120; // 2 minutes

@injectable()
export class CachedPaymentRepository implements IPaymentRepository {
  constructor(
    @inject('PaymentRepositoryFirestore') private baseRepo: PaymentRepositoryFirestore,
    @inject('RedisService') private cache: RedisService
  ) {}

  async create(payment: Payment, orgId: string): Promise<Payment> {
    const result = await this.baseRepo.create(payment, orgId);
    
    // Invalidate all payment caches for this org
    await this.cache.invalidatePattern(`${COLLECTION_NAME}:${orgId}:*`);
    
    return result;
  }

  async findById(id: string, orgId: string): Promise<Payment | null> {
    const cacheKey = this.cache.generateKey(COLLECTION_NAME, orgId, id);
    
    const cached = await this.cache.get<Payment>(cacheKey);
    if (cached) {
      return this.rehydratePayment(cached);
    }

    const payment = await this.baseRepo.findById(id, orgId);
    
    if (payment) {
      await this.cache.set(cacheKey, payment, ENTITY_TTL);
    }
    
    return payment;
  }

  async findByBookingId(bookingId: string, orgId: string): Promise<Payment[]> {
    const cacheKey = `${COLLECTION_NAME}:${orgId}:booking:${bookingId}`;
    
    const cached = await this.cache.get<Payment[]>(cacheKey);
    if (cached) {
      return cached.map(p => this.rehydratePayment(p));
    }

    const payments = await this.baseRepo.findByBookingId(bookingId, orgId);
    
    if (payments.length > 0) {
      await this.cache.set(cacheKey, payments, LIST_TTL);
    }
    
    return payments;
  }

  async findByCustomerId(customerId: string, orgId: string): Promise<Payment[]> {
    const cacheKey = `${COLLECTION_NAME}:${orgId}:customer:${customerId}`;
    
    const cached = await this.cache.get<Payment[]>(cacheKey);
    if (cached) {
      return cached.map(p => this.rehydratePayment(p));
    }

    const payments = await this.baseRepo.findByCustomerId(customerId, orgId);
    
    if (payments.length > 0) {
      await this.cache.set(cacheKey, payments, LIST_TTL);
    }
    
    return payments;
  }

  async findByVendorId(vendorId: string, orgId: string): Promise<Payment[]> {
    const cacheKey = `${COLLECTION_NAME}:${orgId}:vendor:${vendorId}`;
    
    const cached = await this.cache.get<Payment[]>(cacheKey);
    if (cached) {
      return cached.map(p => this.rehydratePayment(p));
    }

    const payments = await this.baseRepo.findByVendorId(vendorId, orgId);
    
    if (payments.length > 0) {
      await this.cache.set(cacheKey, payments, LIST_TTL);
    }
    
    return payments;
  }

  async findByType(paymentType: PaymentType, orgId: string): Promise<Payment[]> {
    const cacheKey = `${COLLECTION_NAME}:${orgId}:type:${paymentType}`;
    
    const cached = await this.cache.get<Payment[]>(cacheKey);
    if (cached) {
      return cached.map(p => this.rehydratePayment(p));
    }

    const payments = await this.baseRepo.findByType(paymentType, orgId);
    
    if (payments.length > 0) {
      await this.cache.set(cacheKey, payments, LIST_TTL);
    }
    
    return payments;
  }

  async countAll(orgId: string): Promise<number> {
    const cacheKey = `${COLLECTION_NAME}:${orgId}:count`;
    
    const cached = await this.cache.get<number>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    const count = await this.baseRepo.countAll(orgId);
    
    await this.cache.set(cacheKey, count, LIST_TTL);
    
    return count;
  }

  async findAll(orgId: string, limit: number = 20, offset: number = 0): Promise<Payment[]> {
    const cacheKey = this.cache.generateListKey(COLLECTION_NAME, orgId, { limit, offset });
    
    const cached = await this.cache.get<Payment[]>(cacheKey);
    if (cached) {
      return cached.map(p => this.rehydratePayment(p));
    }

    const payments = await this.baseRepo.findAll(orgId, limit, offset);
    
    if (payments.length > 0) {
      await this.cache.set(cacheKey, payments, LIST_TTL);
    }
    
    return payments;
  }

  async update(payment: Payment, orgId: string): Promise<Payment> {
    const result = await this.baseRepo.update(payment, orgId);
    
    await this.invalidatePaymentCache(payment.id, orgId);
    
    return result;
  }

  async delete(id: string, orgId: string): Promise<boolean> {
    const result = await this.baseRepo.delete(id, orgId);
    
    if (result) {
      await this.invalidatePaymentCache(id, orgId);
    }
    
    return result;
  }

  async getTotalReceivablesByBooking(bookingId: string, orgId: string): Promise<number> {
    const cacheKey = `${COLLECTION_NAME}:${orgId}:receivables:${bookingId}`;
    
    const cached = await this.cache.get<number>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    const total = await this.baseRepo.getTotalReceivablesByBooking(bookingId, orgId);
    
    await this.cache.set(cacheKey, total, LIST_TTL);
    
    return total;
  }

  async getTotalExpensesByVendor(vendorId: string, orgId: string): Promise<number> {
    const cacheKey = `${COLLECTION_NAME}:${orgId}:expenses:${vendorId}`;
    
    const cached = await this.cache.get<number>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    const total = await this.baseRepo.getTotalExpensesByVendor(vendorId, orgId);
    
    await this.cache.set(cacheKey, total, LIST_TTL);
    
    return total;
  }

  async getTotalRefundsByBooking(bookingId: string, orgId: string): Promise<{ inbound: number; outbound: number }> {
    const cacheKey = `${COLLECTION_NAME}:${orgId}:refunds:${bookingId}`;
    
    const cached = await this.cache.get<{ inbound: number; outbound: number }>(cacheKey);
    if (cached) {
      return cached;
    }

    const refunds = await this.baseRepo.getTotalRefundsByBooking(bookingId, orgId);
    
    await this.cache.set(cacheKey, refunds, LIST_TTL);
    
    return refunds;
  }

  /**
   * Invalidate all caches related to a payment
   */
  private async invalidatePaymentCache(id: string, orgId: string): Promise<void> {
    const idKey = this.cache.generateKey(COLLECTION_NAME, orgId, id);
    await this.cache.delete(idKey);
    
    // Invalidate all list and aggregation caches
    await this.cache.invalidatePattern(`${COLLECTION_NAME}:${orgId}:*`);
  }

  /**
   * IMPORTANT: Restores prototype chain so domain methods work after JSON deserialization
   */
  private rehydratePayment(data: any): Payment {
    return rehydrateObject<Payment>(data, Payment.prototype, COMMON_DATE_FIELDS.payment);
  }
}
