import { injectable, inject } from 'tsyringe';
import { IPaymentRepository } from '../../../application/repositories/IPaymentRepository';
import { Payment } from '../../../domain/Payment';
import { PaymentRepositoryMongo } from './PaymentRepositoryMongo';
import { RedisService } from '../../services/RedisService';
import { PaymentType } from '../../../models/FirestoreTypes';

const COLLECTION_NAME = 'payments';
const ENTITY_TTL = 300; // 5 minutes
const LIST_TTL = 600; // 10 minutes

@injectable()
export class CachedPaymentRepositoryMongo implements IPaymentRepository {
  constructor(
    @inject('PaymentRepositoryMongo') private baseRepo: PaymentRepositoryMongo,
    @inject('RedisService') private cache: RedisService
  ) {}

  async create(payment: Payment, orgId: string): Promise<Payment> {
    const result = await this.baseRepo.create(payment, orgId);
    await this.cache.invalidatePattern(`${COLLECTION_NAME}:${orgId}:*`);
    return result;
  }

  async findById(id: string, orgId: string): Promise<Payment | null> {
    const cacheKey = this.cache.generateKey(COLLECTION_NAME, orgId, id);
    
    const cached = await this.cache.get<Payment>(cacheKey);
    if (cached) {
      // Return fresh from DB for now
    }

    const payment = await this.baseRepo.findById(id, orgId);
    
    if (payment) {
      await this.cache.set(cacheKey, payment, ENTITY_TTL);
    }
    
    return payment;
  }

  async findByBookingId(bookingId: string, orgId: string): Promise<Payment[]> {
    return this.baseRepo.findByBookingId(bookingId, orgId);
  }

  async findByBookingIds(
    bookingIds: string[],
    orgId: string,
    paymentTypes?: PaymentType[]
  ): Promise<Payment[]> {
    return this.baseRepo.findByBookingIds(bookingIds, orgId, paymentTypes);
  }

  async findByCustomerId(customerId: string, orgId: string): Promise<Payment[]> {
    return this.baseRepo.findByCustomerId(customerId, orgId);
  }

  async findByVendorId(vendorId: string, orgId: string): Promise<Payment[]> {
    return this.baseRepo.findByVendorId(vendorId, orgId);
  }

  async findByType(paymentType: PaymentType, orgId: string): Promise<Payment[]> {
    return this.baseRepo.findByType(paymentType, orgId);
  }

  async findAll(orgId: string, limit?: number, offset?: number, paymentType?: PaymentType): Promise<Payment[]> {
    return this.baseRepo.findAll(orgId, limit, offset, paymentType);
  }

  async countAll(orgId: string, paymentType?: PaymentType): Promise<number> {
    return this.baseRepo.countAll(orgId, paymentType);
  }

  async update(payment: Payment, orgId: string): Promise<Payment> {
    const result = await this.baseRepo.update(payment, orgId);
    await this.invalidateCacheForPayment(payment.id, orgId);
    return result;
  }

  async delete(id: string, orgId: string): Promise<boolean> {
    const result = await this.baseRepo.delete(id, orgId);
    if (result) {
      await this.invalidateCacheForPayment(id, orgId);
    }
    return result;
  }

  async getTotalReceivablesByBooking(bookingId: string, orgId: string): Promise<number> {
    return this.baseRepo.getTotalReceivablesByBooking(bookingId, orgId);
  }

  async getTotalExpensesByVendor(vendorId: string, orgId: string): Promise<number> {
    return this.baseRepo.getTotalExpensesByVendor(vendorId, orgId);
  }

  async getTotalRefundsByBooking(bookingId: string, orgId: string): Promise<{ inbound: number; outbound: number }> {
    return this.baseRepo.getTotalRefundsByBooking(bookingId, orgId);
  }

  async invalidateCacheForPayment(paymentId: string, orgId: string): Promise<void> {
    const entityKey = this.cache.generateKey(COLLECTION_NAME, orgId, paymentId);
    await this.cache.delete(entityKey);
    await this.cache.invalidatePattern(`${COLLECTION_NAME}:${orgId}:list*`);
  }

  async invalidateCacheForBookingPayments(bookingId: string, orgId: string): Promise<void> {
    await this.cache.invalidatePattern(`${COLLECTION_NAME}:${orgId}:booking:${bookingId}*`);
    await this.cache.invalidatePattern(`${COLLECTION_NAME}:${orgId}:list*`);
  }
}
