import { Vendor } from '../../domain/Vendor';
import { ServiceType } from '../../models/FirestoreTypes';

export interface IVendorRepository {
  create(vendor: Vendor, orgId: string): Promise<Vendor>;
  findById(id: string, orgId: string): Promise<Vendor | null>;
  findByEmail(email: string, orgId: string): Promise<Vendor | null>;
  findByPhone(phone: string, orgId: string): Promise<Vendor | null>;
  findByNameAndServiceType(name: string, serviceType: ServiceType, orgId: string): Promise<Vendor | null>;
  findByAccountId(accountId: string, orgId: string): Promise<Vendor | null>;
  findByServiceType(serviceType: ServiceType, orgId: string): Promise<Vendor[]>;
  findAll(orgId: string, limit?: number, offset?: number): Promise<Vendor[]>;
  countAll(orgId: string): Promise<number>;
  update(vendor: Vendor, orgId: string): Promise<Vendor>;
  softDelete(id: string, orgId: string, updatedBy: string): Promise<boolean>;
  delete(id: string, orgId: string): Promise<boolean>;
  archive(id: string, orgId: string, updatedBy: string): Promise<boolean>;
  search(query: string, orgId: string, limit?: number): Promise<Vendor[]>;
  getActiveVendors(orgId: string): Promise<Vendor[]>;
  getVendorExpenseStats(vendorId: string, orgId: string): Promise<{
    totalExpense: number;
    totalBookings: number;
    lastTransactionDate?: Date;
  }>;
  
  // Cache management
  invalidateCacheForVendor(vendorId: string, orgId: string): Promise<void>;
}
