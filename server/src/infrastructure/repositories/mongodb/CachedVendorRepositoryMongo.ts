import { injectable, inject } from 'tsyringe';
import { IVendorRepository } from '../../../application/repositories/IVendorRepository';
import { Vendor } from '../../../domain/Vendor';
import { VendorRepositoryMongo } from './VendorRepositoryMongo';
import { RedisService } from '../../services/RedisService';
import { rehydrateObject, COMMON_DATE_FIELDS } from '../../../utils/cacheRehydration';
import { ServiceType } from '../../../models/FirestoreTypes';

const COLLECTION_NAME = 'vendors';
const ENTITY_TTL = 300; // 5 minutes
const LIST_TTL = 900; // 15 minutes

interface CachedVendor {
  id: string;
  orgId: string;
  name: string;
  serviceType: ServiceType;
  pocName?: string;
  phone?: string;
  email?: string;
  gstin?: string;
  accountId?: string;
  totalExpense: number;
  totalBookings: number;
  createdBy: string;
  updatedBy: string;
  isDeleted: boolean;
  archivedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

@injectable()
export class CachedVendorRepositoryMongo implements IVendorRepository {
  constructor(
    @inject('VendorRepositoryMongo') private baseRepo: VendorRepositoryMongo,
    @inject('RedisService') private cache: RedisService
  ) {}

  private rehydrateVendor(cached: CachedVendor): Vendor {
    const rehydrated = rehydrateObject(cached, COMMON_DATE_FIELDS) as CachedVendor;
    return new Vendor(
      rehydrated.id,
      rehydrated.orgId,
      rehydrated.name,
      rehydrated.serviceType,
      rehydrated.pocName,
      rehydrated.phone,
      rehydrated.email,
      rehydrated.gstin,
      rehydrated.accountId,
      rehydrated.totalExpense,
      rehydrated.totalBookings,
      rehydrated.createdBy,
      rehydrated.updatedBy,
      rehydrated.isDeleted,
      rehydrated.archivedAt,
      rehydrated.createdAt,
      rehydrated.updatedAt
    );
  }

  async create(vendor: Vendor, orgId: string): Promise<Vendor> {
    const result = await this.baseRepo.create(vendor, orgId);
    await this.cache.invalidatePattern(`${COLLECTION_NAME}:${orgId}:list*`);
    return result;
  }

  async findById(id: string, orgId: string): Promise<Vendor | null> {
    const cacheKey = this.cache.generateKey(COLLECTION_NAME, orgId, id);
    
    const cached = await this.cache.get<CachedVendor>(cacheKey);
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
    return this.baseRepo.findByEmail(email, orgId);
  }

  async findByPhone(phone: string, orgId: string): Promise<Vendor | null> {
    return this.baseRepo.findByPhone(phone, orgId);
  }

  async findByNameAndServiceType(name: string, serviceType: ServiceType, orgId: string): Promise<Vendor | null> {
    return this.baseRepo.findByNameAndServiceType(name, serviceType, orgId);
  }

  async findByAccountId(accountId: string, orgId: string): Promise<Vendor | null> {
    return this.baseRepo.findByAccountId(accountId, orgId);
  }

  async findByServiceType(serviceType: ServiceType, orgId: string): Promise<Vendor[]> {
    return this.baseRepo.findByServiceType(serviceType, orgId);
  }

  async findAll(orgId: string, limit?: number, offset?: number): Promise<Vendor[]> {
    const cacheKey = `${COLLECTION_NAME}:${orgId}:list:all:${limit || 'all'}:${offset || 0}`;
    
    const cached = await this.cache.get<Vendor[]>(cacheKey);
    if (cached) {
      return cached.map(v => this.rehydrateVendor(v));
    }

    const vendors = await this.baseRepo.findAll(orgId, limit, offset);
    await this.cache.set(cacheKey, vendors, LIST_TTL);
    
    return vendors;
  }

  async countAll(orgId: string): Promise<number> {
    return this.baseRepo.countAll(orgId);
  }

  async update(vendor: Vendor, orgId: string): Promise<Vendor> {
    const result = await this.baseRepo.update(vendor, orgId);
    await this.invalidateCacheForVendor(vendor.id, orgId);
    return result;
  }

  async softDelete(id: string, orgId: string, updatedBy: string): Promise<boolean> {
    const result = await this.baseRepo.softDelete(id, orgId, updatedBy);
    if (result) {
      await this.invalidateCacheForVendor(id, orgId);
    }
    return result;
  }

  async delete(id: string, orgId: string): Promise<boolean> {
    const result = await this.baseRepo.delete(id, orgId);
    if (result) {
      await this.invalidateCacheForVendor(id, orgId);
    }
    return result;
  }

  async archive(id: string, orgId: string, updatedBy: string): Promise<boolean> {
    const result = await this.baseRepo.archive(id, orgId, updatedBy);
    if (result) {
      await this.invalidateCacheForVendor(id, orgId);
    }
    return result;
  }

  async search(query: string, orgId: string, limit?: number): Promise<Vendor[]> {
    return this.baseRepo.search(query, orgId, limit);
  }

  async getActiveVendors(orgId: string): Promise<Vendor[]> {
    return this.baseRepo.getActiveVendors(orgId);
  }

  async getVendorExpenseStats(vendorId: string, orgId: string): Promise<{
    totalExpense: number;
    totalBookings: number;
    lastTransactionDate?: Date;
  }> {
    return this.baseRepo.getVendorExpenseStats(vendorId, orgId);
  }

  async invalidateCacheForVendor(vendorId: string, orgId: string): Promise<void> {
    const entityKey = this.cache.generateKey(COLLECTION_NAME, orgId, vendorId);
    await this.cache.delete(entityKey);
    await this.cache.invalidatePattern(`${COLLECTION_NAME}:${orgId}:list*`);
  }
}
