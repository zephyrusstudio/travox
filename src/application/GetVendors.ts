import { injectable, inject } from 'tsyringe';
import { IVendorRepository } from './Repositories/IVendorRepository';
import { Vendor } from '../domain/Vendor';
import { ServiceType } from '../models/FirestoreTypes';

interface GetVendorsOptions {
  limit?: number;
  serviceType?: ServiceType;
}

@injectable()
export class GetVendors {
  constructor(
    @inject('IVendorRepository') private vendorRepo: IVendorRepository
  ) {}

  async execute(orgId: string, options?: GetVendorsOptions): Promise<Vendor[]> {
    if (options?.serviceType) {
      return await this.vendorRepo.findByServiceType(options.serviceType, orgId);
    }
    
    return await this.vendorRepo.findAll(orgId, options?.limit);
  }

  async findById(vendorId: string, orgId: string): Promise<Vendor | null> {
    return await this.vendorRepo.findById(vendorId, orgId);
  }

  async search(query: string, orgId: string, options?: { serviceType?: ServiceType; limit?: number }): Promise<Vendor[]> {
    if (!query?.trim()) {
      return await this.execute(orgId, { limit: options?.limit, serviceType: options?.serviceType });
    }

    return await this.vendorRepo.search(query.trim(), orgId, options?.limit);
  }

  async getActiveVendors(orgId: string): Promise<Vendor[]> {
    return await this.vendorRepo.getActiveVendors(orgId);
  }

  async getVendorStats(vendorId: string, orgId: string) {
    return await this.vendorRepo.getVendorExpenseStats(vendorId, orgId);
  }

  async getVendorsByServiceType(serviceType: ServiceType, orgId: string): Promise<Vendor[]> {
    return await this.vendorRepo.findByServiceType(serviceType, orgId);
  }
}
