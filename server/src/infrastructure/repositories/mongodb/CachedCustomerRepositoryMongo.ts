import { injectable, inject } from 'tsyringe';
import { ICustomerRepository, CustomerSearchParams } from '../../../application/repositories/ICustomerRepository';
import { Customer } from '../../../domain/Customer';
import { CustomerRepositoryMongo } from './CustomerRepositoryMongo';
import { RedisService } from '../../services/RedisService';
import { rehydrateObject, COMMON_DATE_FIELDS } from '../../../utils/cacheRehydration';

const COLLECTION_NAME = 'customers';
const ENTITY_TTL = 300; // 5 minutes
const LIST_TTL = 900; // 15 minutes
const STATS_TTL = 120; // 2 minutes

interface CachedCustomer {
  id: string;
  orgId: string;
  name: string;
  phone?: string;
  email?: string;
  passportNo?: string;
  aadhaarNo?: string;
  visaNo?: string;
  gstin?: string;
  accountId?: string;
  totalBookings: number;
  totalSpent: number;
  createdBy: string;
  updatedBy: string;
  isDeleted: boolean;
  archivedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

@injectable()
export class CachedCustomerRepositoryMongo implements ICustomerRepository {
  constructor(
    @inject('CustomerRepositoryMongo') private baseRepo: CustomerRepositoryMongo,
    @inject('RedisService') private cache: RedisService
  ) {}

  private rehydrateCustomer(cached: CachedCustomer): Customer {
    const rehydrated = rehydrateObject(cached, COMMON_DATE_FIELDS) as CachedCustomer;
    return new Customer(
      rehydrated.id,
      rehydrated.orgId,
      rehydrated.name,
      rehydrated.phone,
      rehydrated.email,
      rehydrated.passportNo,
      rehydrated.aadhaarNo,
      rehydrated.visaNo,
      rehydrated.gstin,
      rehydrated.accountId,
      rehydrated.totalBookings,
      rehydrated.totalSpent,
      rehydrated.createdBy,
      rehydrated.updatedBy,
      rehydrated.isDeleted,
      rehydrated.archivedAt,
      rehydrated.createdAt,
      rehydrated.updatedAt
    );
  }

  async create(customer: Customer, orgId: string): Promise<Customer> {
    const result = await this.baseRepo.create(customer, orgId);
    await this.cache.invalidatePattern(`${COLLECTION_NAME}:${orgId}:list*`);
    return result;
  }

  async findById(id: string, orgId: string): Promise<Customer | null> {
    const cacheKey = this.cache.generateKey(COLLECTION_NAME, orgId, id);
    
    const cached = await this.cache.get<CachedCustomer>(cacheKey);
    if (cached) {
      return this.rehydrateCustomer(cached);
    }

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
    const cacheKey = `${COLLECTION_NAME}:${orgId}:list:all:${limit || 'all'}`;
    
    const cached = await this.cache.get<Customer[]>(cacheKey);
    if (cached) {
      return cached.map(c => this.rehydrateCustomer(c));
    }

    const customers = await this.baseRepo.findAll(orgId, limit);
    await this.cache.set(cacheKey, customers, LIST_TTL);
    
    return customers;
  }

  async update(customer: Customer, orgId: string): Promise<Customer> {
    const result = await this.baseRepo.update(customer, orgId);
    await this.invalidateCacheForCustomer(customer.id, orgId);
    return result;
  }

  async softDelete(id: string, orgId: string, updatedBy: string): Promise<boolean> {
    const result = await this.baseRepo.softDelete(id, orgId, updatedBy);
    if (result) {
      await this.invalidateCacheForCustomer(id, orgId);
    }
    return result;
  }

  async delete(id: string, orgId: string): Promise<boolean> {
    const result = await this.baseRepo.delete(id, orgId);
    if (result) {
      await this.invalidateCacheForCustomer(id, orgId);
    }
    return result;
  }

  async archive(id: string, orgId: string, updatedBy: string): Promise<boolean> {
    const result = await this.baseRepo.archive(id, orgId, updatedBy);
    if (result) {
      await this.invalidateCacheForCustomer(id, orgId);
    }
    return result;
  }

  async search(query: string, orgId: string, limit?: number): Promise<Customer[]> {
    return this.baseRepo.search(query, orgId, limit);
  }

  async advancedSearch(params: CustomerSearchParams, orgId: string): Promise<Customer[]> {
    return this.baseRepo.advancedSearch(params, orgId);
  }

  async getActiveCustomers(orgId: string, limit?: number, offset?: number): Promise<Customer[]> {
    const cacheKey = `${COLLECTION_NAME}:${orgId}:list:active:${limit || 'all'}:${offset || 0}`;
    
    const cached = await this.cache.get<Customer[]>(cacheKey);
    if (cached) {
      return cached.map(c => this.rehydrateCustomer(c));
    }

    const customers = await this.baseRepo.getActiveCustomers(orgId, limit, offset);
    await this.cache.set(cacheKey, customers, LIST_TTL);
    
    return customers;
  }

  async countActiveCustomers(orgId: string): Promise<number> {
    const cacheKey = `${COLLECTION_NAME}:${orgId}:count:active`;
    
    const cached = await this.cache.get<number>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    const count = await this.baseRepo.countActiveCustomers(orgId);
    await this.cache.set(cacheKey, count, STATS_TTL);
    
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
    await this.cache.set(cacheKey, stats, STATS_TTL);
    
    return stats;
  }

  async invalidateCacheForCustomer(customerId: string, orgId: string): Promise<void> {
    const entityKey = this.cache.generateKey(COLLECTION_NAME, orgId, customerId);
    await this.cache.delete(entityKey);
    await this.cache.invalidatePattern(`${COLLECTION_NAME}:${orgId}:list*`);
    await this.cache.invalidatePattern(`${COLLECTION_NAME}:${orgId}:count*`);
    await this.cache.invalidatePattern(`${COLLECTION_NAME}:${orgId}:stats:${customerId}`);
    await this.cache.invalidatePattern(`${COLLECTION_NAME}:${orgId}:email*`);
    await this.cache.invalidatePattern(`${COLLECTION_NAME}:${orgId}:phone*`);
    await this.cache.invalidatePattern(`${COLLECTION_NAME}:${orgId}:passport*`);
    await this.cache.invalidatePattern(`${COLLECTION_NAME}:${orgId}:account*`);
  }
}
