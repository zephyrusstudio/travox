import { injectable, inject } from 'tsyringe';
import { IVendorRepository } from '../../application/repositories/IVendorRepository';
import { Vendor } from '../../domain/Vendor';
import { ServiceType } from '../../models/FirestoreTypes';
import { VendorRepositoryFirestore } from './VendorRepositoryFirestore';
import { RedisService } from '../services/RedisService';
import { rehydrateObject, COMMON_DATE_FIELDS } from '../../utils/cacheRehydration';

const COLLECTION_NAME = 'vendors';
const ENTITY_TTL = 300; // 5 minutes
const LIST_TTL = 900; // 15 minutes
const STATS_TTL = 120; // 2 minutes

@injectable()
export class CachedVendorRepository implements IVendorRepository {
  constructor(
    @inject('VendorRepositoryFirestore') private baseRepo: VendorRepositoryFirestore,
    @inject('RedisService') private cache: RedisService
  ) {}

  async create(vendor: Vendor, orgId: string): Promise<Vendor> {
    const result = await this.baseRepo.create(vendor, orgId);
    
    // Invalidate list caches
    await this.cache.invalidatePattern(`${COLLECTION_NAME}:${orgId}:list*`);
    
    return result;
  }

  async findById(id: string, orgId: string): Promise<Vendor | null> {
    const cacheKey = this.cache.generateKey(COLLECTION_NAME, orgId, id);
    
    const cached = await this.cache.get<Vendor>(cacheKey);
    if (cached) {
      return this.rehydrateVendor(cached);
    }

    const vendor = await this.baseRepo.findById(id, orgId);
    
    if (vendor) {
      await this.cache.set(cacheKey, vendor, ENTITY_TTL);
    }
    
    return vendor;
  }

  async findByEmail(email: string, orgId: string): Promise<Vendor | null> {
    const cacheKey = `${COLLECTION_NAME}:${orgId}:email:${email}`;
    
    const cached = await this.cache.get<Vendor>(cacheKey);
    if (cached) {
      return this.rehydrateVendor(cached);
    }

    const vendor = await this.baseRepo.findByEmail(email, orgId);
    
    if (vendor) {
      await this.cache.set(cacheKey, vendor, ENTITY_TTL);
    }
    
    return vendor;
  }

  async findByPhone(phone: string, orgId: string): Promise<Vendor | null> {
    const cacheKey = `${COLLECTION_NAME}:${orgId}:phone:${phone}`;
    
    const cached = await this.cache.get<Vendor>(cacheKey);
    if (cached) {
      return this.rehydrateVendor(cached);
    }

    const vendor = await this.baseRepo.findByPhone(phone, orgId);
    
    if (vendor) {
      await this.cache.set(cacheKey, vendor, ENTITY_TTL);
    }
    
    return vendor;
  }

  async findByAccountId(accountId: string, orgId: string): Promise<Vendor | null> {
    const cacheKey = `${COLLECTION_NAME}:${orgId}:account:${accountId}`;
    
    const cached = await this.cache.get<Vendor>(cacheKey);
    if (cached) {
      return this.rehydrateVendor(cached);
    }

    const vendor = await this.baseRepo.findByAccountId(accountId, orgId);
    
    if (vendor) {
      await this.cache.set(cacheKey, vendor, ENTITY_TTL);
    }
    
    return vendor;
  }

  async findByNameAndServiceType(name: string, serviceType: ServiceType, orgId: string): Promise<Vendor | null> {
    const cacheKey = `${COLLECTION_NAME}:${orgId}:name-service:${name}:${serviceType}`;
    
    const cached = await this.cache.get<Vendor>(cacheKey);
    if (cached) {
      return this.rehydrateVendor(cached);
    }

    const vendor = await this.baseRepo.findByNameAndServiceType(name, serviceType, orgId);
    
    if (vendor) {
      await this.cache.set(cacheKey, vendor, ENTITY_TTL);
    }
    
    return vendor;
  }

  async findByServiceType(serviceType: ServiceType, orgId: string): Promise<Vendor[]> {
    const cacheKey = `${COLLECTION_NAME}:${orgId}:service:${serviceType}`;
    
    const cached = await this.cache.get<Vendor[]>(cacheKey);
    if (cached) {
      return cached.map(v => this.rehydrateVendor(v));
    }

    const vendors = await this.baseRepo.findByServiceType(serviceType, orgId);
    
    if (vendors.length > 0) {
      await this.cache.set(cacheKey, vendors, LIST_TTL);
    }
    
    return vendors;
  }

  async findAll(orgId: string, limit?: number, offset?: number): Promise<Vendor[]> {
    const cacheKey = this.cache.generateListKey(COLLECTION_NAME, orgId, { limit, offset });
    
    const cached = await this.cache.get<Vendor[]>(cacheKey);
    if (cached) {
      return cached.map(v => this.rehydrateVendor(v));
    }

    const vendors = await this.baseRepo.findAll(orgId, limit, offset);
    
    if (vendors.length > 0) {
      await this.cache.set(cacheKey, vendors, LIST_TTL);
    }
    
    return vendors;
  }

  async countAll(orgId: string): Promise<number> {
    const cacheKey = `${COLLECTION_NAME}:${orgId}:count:all`;
    
    const cached = await this.cache.get<number>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    const count = await this.baseRepo.countAll(orgId);
    
    await this.cache.set(cacheKey, count, LIST_TTL);
    
    return count;
  }

  async update(vendor: Vendor, orgId: string): Promise<Vendor> {
    const result = await this.baseRepo.update(vendor, orgId);
    
    await this.invalidateVendorCache(vendor.id, orgId);
    
    return result;
  }

  async softDelete(id: string, orgId: string, updatedBy: string): Promise<boolean> {
    const result = await this.baseRepo.softDelete(id, orgId, updatedBy);
    
    if (result) {
      await this.invalidateVendorCache(id, orgId);
    }
    
    return result;
  }

  async delete(id: string, orgId: string): Promise<boolean> {
    const result = await this.baseRepo.delete(id, orgId);
    
    if (result) {
      await this.invalidateVendorCache(id, orgId);
    }
    
    return result;
  }

  async archive(id: string, orgId: string, updatedBy: string): Promise<boolean> {
    const result = await this.baseRepo.archive(id, orgId, updatedBy);
    
    if (result) {
      await this.invalidateVendorCache(id, orgId);
    }
    
    return result;
  }

  async search(query: string, orgId: string, limit?: number): Promise<Vendor[]> {
    // Search results are dynamic, don't cache
    return this.baseRepo.search(query, orgId, limit);
  }

  async getActiveVendors(orgId: string): Promise<Vendor[]> {
    const cacheKey = `${COLLECTION_NAME}:${orgId}:active`;
    
    const cached = await this.cache.get<Vendor[]>(cacheKey);
    if (cached) {
      return cached.map(v => this.rehydrateVendor(v));
    }

    const vendors = await this.baseRepo.getActiveVendors(orgId);
    
    if (vendors.length > 0) {
      await this.cache.set(cacheKey, vendors, LIST_TTL);
    }
    
    return vendors;
  }

  async getVendorExpenseStats(vendorId: string, orgId: string): Promise<{
    totalExpense: number;
    totalBookings: number;
    lastTransactionDate?: Date;
  }> {
    const cacheKey = `${COLLECTION_NAME}:${orgId}:stats:${vendorId}`;
    
    const cached = await this.cache.get<any>(cacheKey);
    if (cached) {
      return {
        ...cached,
        lastTransactionDate: cached.lastTransactionDate ? new Date(cached.lastTransactionDate) : undefined
      };
    }

    const stats = await this.baseRepo.getVendorExpenseStats(vendorId, orgId);
    
    await this.cache.set(cacheKey, stats, LIST_TTL);
    
    return stats;
  }

  /**
   * Invalidate all caches related to a vendor
   */
  private async invalidateVendorCache(id: string, orgId: string): Promise<void> {
    const idKey = this.cache.generateKey(COLLECTION_NAME, orgId, id);
    await this.cache.delete(idKey);
    
    await this.cache.invalidatePattern(`${COLLECTION_NAME}:${orgId}:list*`);
    await this.cache.invalidatePattern(`${COLLECTION_NAME}:${orgId}:email:*`);
    await this.cache.invalidatePattern(`${COLLECTION_NAME}:${orgId}:phone:*`);
    await this.cache.invalidatePattern(`${COLLECTION_NAME}:${orgId}:account:*`);
    await this.cache.invalidatePattern(`${COLLECTION_NAME}:${orgId}:name-service:*`);
    await this.cache.invalidatePattern(`${COLLECTION_NAME}:${orgId}:service:*`);
    await this.cache.invalidatePattern(`${COLLECTION_NAME}:${orgId}:count:*`);
    await this.cache.invalidatePattern(`${COLLECTION_NAME}:${orgId}:active`);
    await this.cache.invalidatePattern(`${COLLECTION_NAME}:${orgId}:stats:*`);
  }

  /**
   * IMPORTANT: Restores prototype chain so domain methods work after JSON deserialization
   */
  private rehydrateVendor(data: any): Vendor {
    return rehydrateObject<Vendor>(data, Vendor.prototype, COMMON_DATE_FIELDS.timestamps);
  }
}
