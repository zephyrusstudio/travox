import { injectable, inject } from 'tsyringe';
import { ICustomerRepository } from '../../application/repositories/ICustomerRepository';
import { Customer } from '../../domain/Customer';
import { CustomerRepositoryFirestore } from './CustomerRepositoryFirestore';
import { RedisService } from '../services/RedisService';
import { rehydrateObject, COMMON_DATE_FIELDS } from '../../utils/cacheRehydration';

const COLLECTION_NAME = 'customers';
const ENTITY_TTL = 300; // 5 minutes
const LIST_TTL = 900; // 15 minutes
const STATS_TTL = 120; // 2 minutes

@injectable()
export class CachedCustomerRepository implements ICustomerRepository {
  constructor(
    @inject('CustomerRepositoryFirestore') private baseRepo: CustomerRepositoryFirestore,
    @inject('RedisService') private cache: RedisService
  ) {}

  async create(customer: Customer, orgId: string): Promise<Customer> {
    const result = await this.baseRepo.create(customer, orgId);
    
    // Invalidate list caches
    await this.cache.invalidatePattern(`${COLLECTION_NAME}:${orgId}:list*`);
    
    return result;
  }

  async findById(id: string, orgId: string): Promise<Customer | null> {
    const cacheKey = this.cache.generateKey(COLLECTION_NAME, orgId, id);
    
    // Try cache first
    const cached = await this.cache.get<Customer>(cacheKey);
    if (cached) {
      return this.rehydrateCustomer(cached);
    }

    // Cache miss - fetch from Firestore
    const customer = await this.baseRepo.findById(id, orgId);
    
    if (customer) {
      await this.cache.set(cacheKey, customer, ENTITY_TTL);
    }
    
    return customer;
  }

  async findByEmail(email: string, orgId: string): Promise<Customer | null> {
    const cacheKey = `${COLLECTION_NAME}:${orgId}:email:${email}`;
    
    const cached = await this.cache.get<Customer>(cacheKey);
    if (cached) {
      return this.rehydrateCustomer(cached);
    }

    const customer = await this.baseRepo.findByEmail(email, orgId);
    
    if (customer) {
      await this.cache.set(cacheKey, customer, ENTITY_TTL);
    }
    
    return customer;
  }

  async findByPhone(phone: string, orgId: string): Promise<Customer | null> {
    const cacheKey = `${COLLECTION_NAME}:${orgId}:phone:${phone}`;
    
    const cached = await this.cache.get<Customer>(cacheKey);
    if (cached) {
      return this.rehydrateCustomer(cached);
    }

    const customer = await this.baseRepo.findByPhone(phone, orgId);
    
    if (customer) {
      await this.cache.set(cacheKey, customer, ENTITY_TTL);
    }
    
    return customer;
  }

  async findByPassport(passportNo: string, orgId: string): Promise<Customer | null> {
    const cacheKey = `${COLLECTION_NAME}:${orgId}:passport:${passportNo}`;
    
    const cached = await this.cache.get<Customer>(cacheKey);
    if (cached) {
      return this.rehydrateCustomer(cached);
    }

    const customer = await this.baseRepo.findByPassport(passportNo, orgId);
    
    if (customer) {
      await this.cache.set(cacheKey, customer, ENTITY_TTL);
    }
    
    return customer;
  }

  async findByAccountId(accountId: string, orgId: string): Promise<Customer | null> {
    const cacheKey = `${COLLECTION_NAME}:${orgId}:account:${accountId}`;
    
    const cached = await this.cache.get<Customer>(cacheKey);
    if (cached) {
      return this.rehydrateCustomer(cached);
    }

    const customer = await this.baseRepo.findByAccountId(accountId, orgId);
    
    if (customer) {
      await this.cache.set(cacheKey, customer, ENTITY_TTL);
    }
    
    return customer;
  }

  async findAll(orgId: string, limit?: number): Promise<Customer[]> {
    const cacheKey = this.cache.generateListKey(COLLECTION_NAME, orgId, { limit });
    
    const cached = await this.cache.get<Customer[]>(cacheKey);
    if (cached) {
      return cached.map(c => this.rehydrateCustomer(c));
    }

    const customers = await this.baseRepo.findAll(orgId, limit);
    
    if (customers.length > 0) {
      await this.cache.set(cacheKey, customers, LIST_TTL);
    }
    
    return customers;
  }

  async update(customer: Customer, orgId: string): Promise<Customer> {
    const result = await this.baseRepo.update(customer, orgId);
    
    // Invalidate caches
    await this.invalidateCustomerCache(customer.id, orgId);
    
    return result;
  }

  async softDelete(id: string, orgId: string, updatedBy: string): Promise<boolean> {
    const result = await this.baseRepo.softDelete(id, orgId, updatedBy);
    
    if (result) {
      await this.invalidateCustomerCache(id, orgId);
    }
    
    return result;
  }

  async delete(id: string, orgId: string): Promise<boolean> {
    const result = await this.baseRepo.delete(id, orgId);
    
    if (result) {
      await this.invalidateCustomerCache(id, orgId);
    }
    
    return result;
  }

  async archive(id: string, orgId: string, updatedBy: string): Promise<boolean> {
    const result = await this.baseRepo.archive(id, orgId, updatedBy);
    
    if (result) {
      await this.invalidateCustomerCache(id, orgId);
    }
    
    return result;
  }

  async search(query: string, orgId: string, limit?: number): Promise<Customer[]> {
    // Search results are dynamic, don't cache
    return this.baseRepo.search(query, orgId, limit);
  }

  async getActiveCustomers(orgId: string, limit?: number, offset?: number): Promise<Customer[]> {
    const cacheKey = this.cache.generateListKey(COLLECTION_NAME, orgId, { 
      active: true, 
      limit, 
      offset 
    });
    
    const cached = await this.cache.get<Customer[]>(cacheKey);
    if (cached) {
      return cached.map(c => this.rehydrateCustomer(c));
    }

    const customers = await this.baseRepo.getActiveCustomers(orgId, limit, offset);
    
    if (customers.length > 0) {
      await this.cache.set(cacheKey, customers, LIST_TTL);
    }
    
    return customers;
  }

  async countActiveCustomers(orgId: string): Promise<number> {
    const cacheKey = `${COLLECTION_NAME}:${orgId}:count:active`;
    
    const cached = await this.cache.get<number>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    const count = await this.baseRepo.countActiveCustomers(orgId);
    
    await this.cache.set(cacheKey, count, LIST_TTL);
    
    return count;
  }

  async getCustomerBookingStats(customerId: string, orgId: string): Promise<{
    totalBookings: number;
    totalSpent: number;
    lastBookingDate?: Date;
  }> {
    const cacheKey = `${COLLECTION_NAME}:${orgId}:stats:${customerId}`;
    
    const cached = await this.cache.get<any>(cacheKey);
    if (cached) {
      return {
        ...cached,
        lastBookingDate: cached.lastBookingDate ? new Date(cached.lastBookingDate) : undefined
      };
    }

    const stats = await this.baseRepo.getCustomerBookingStats(customerId, orgId);
    
    await this.cache.set(cacheKey, stats, LIST_TTL);
    
    return stats;
  }

  /**
   * Invalidate all caches related to a customer
   */
  private async invalidateCustomerCache(id: string, orgId: string): Promise<void> {
    // Invalidate by ID
    const idKey = this.cache.generateKey(COLLECTION_NAME, orgId, id);
    await this.cache.delete(idKey);
    
    // Invalidate list caches
    await this.cache.invalidatePattern(`${COLLECTION_NAME}:${orgId}:list*`);
    await this.cache.invalidatePattern(`${COLLECTION_NAME}:${orgId}:count*`);
    await this.cache.invalidatePattern(`${COLLECTION_NAME}:${orgId}:stats:${id}`);
    
    // Invalidate lookup caches (email, phone, etc.) - could be optimized
    await this.cache.invalidatePattern(`${COLLECTION_NAME}:${orgId}:email:*`);
    await this.cache.invalidatePattern(`${COLLECTION_NAME}:${orgId}:phone:*`);
    await this.cache.invalidatePattern(`${COLLECTION_NAME}:${orgId}:passport:*`);
    await this.cache.invalidatePattern(`${COLLECTION_NAME}:${orgId}:account:*`);
  }

  /**
   * Rehydrate Customer object from cached data
   * IMPORTANT: Must restore prototype chain to retain toApiResponse() and other methods
   */
  private rehydrateCustomer(data: any): Customer {
    return rehydrateObject<Customer>(data, Customer.prototype, COMMON_DATE_FIELDS.timestamps);
  }
}
