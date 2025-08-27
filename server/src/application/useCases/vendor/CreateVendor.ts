import { injectable, inject } from 'tsyringe';
import { IVendorRepository } from '../../repositories/IVendorRepository';
import { Vendor } from '../../../domain/Vendor';
import { ServiceType } from '../../../models/FirestoreTypes';

interface CreateVendorDTO {
  name: string;
  serviceType: ServiceType;
  pocName?: string;
  phone?: string;
  email?: string;
  gstin?: string;
  accountId?: string;
}

@injectable()
export class CreateVendor {
  constructor(
    @inject('IVendorRepository') private vendorRepo: IVendorRepository
  ) {}

  async execute(data: CreateVendorDTO, orgId: string, createdBy: string): Promise<Vendor> {
    // Validate mandatory fields
    if (!data.name?.trim()) {
      throw new Error('Vendor name is required');
    }

    if (!data.serviceType) {
      throw new Error('Service type is required');
    }

    if (!data.phone && !data.email) {
      throw new Error('Either phone or email is required');
    }

    // Validate GSTIN format (15 characters)
    if (data.gstin && !this.isValidGSTIN(data.gstin)) {
      throw new Error('GSTIN must be exactly 15 characters');
    }

    // Check for duplicate vendors by name and service type
    const existingVendor = await this.vendorRepo.findByNameAndServiceType(
      data.name.trim(), 
      data.serviceType, 
      orgId
    );
    
    if (existingVendor) {
      throw new Error('Vendor with this name and service type already exists');
    }

    // Check for duplicate by email if provided
    if (data.email) {
      const existingByEmail = await this.vendorRepo.findByEmail(data.email, orgId);
      if (existingByEmail) {
        throw new Error('Vendor with this email already exists');
      }
    }

    // Check for duplicate by phone if provided
    if (data.phone) {
      const existingByPhone = await this.vendorRepo.findByPhone(data.phone, orgId);
      if (existingByPhone) {
        throw new Error('Vendor with this phone already exists');
      }
    }

    // Create new vendor
    const vendor = Vendor.create(orgId, data.name.trim(), data.serviceType, createdBy, {
      pocName: data.pocName?.trim(),
      phone: data.phone?.trim(),
      email: data.email?.trim(),
      gstin: data.gstin?.trim().toUpperCase(),
      accountId: data.accountId,
    });

    return await this.vendorRepo.create(vendor, orgId);
  }

  private isValidGSTIN(gstin: string): boolean {
    // GSTIN should be exactly 15 characters
    return /^[0-9A-Z]{15}$/.test(gstin.toUpperCase());
  }
}
