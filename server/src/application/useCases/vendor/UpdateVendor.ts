import { injectable, inject } from 'tsyringe';
import { IVendorRepository } from '../../repositories/IVendorRepository';
import { Vendor } from '../../../domain/Vendor';
import { ServiceType } from '../../../models/FirestoreTypes';
import { getCurrentISTDate } from '../../../utils/timezone';

@injectable()
export class UpdateVendor {
  constructor(
    @inject('IVendorRepository') private vendorRepo: IVendorRepository
  ) {}

  async execute(id: string, updateData: Partial<{
    name: string;
    serviceType?: ServiceType;
    pocName?: string;
    phone?: string;
    email?: string;
    gstin?: string;
    accountId?: string;
  }>, orgId: string, updatedBy: string): Promise<Vendor> {
    const vendor = await this.vendorRepo.findById(id, orgId);
    if (!vendor) {
      throw new Error('Vendor not found');
    }

    // Update vendor properties
    if (updateData.name !== undefined) vendor.name = updateData.name;
    if (updateData.serviceType !== undefined) vendor.serviceType = updateData.serviceType;
    if (updateData.pocName !== undefined) vendor.pocName = updateData.pocName;
    if (updateData.phone !== undefined) vendor.phone = updateData.phone;
    if (updateData.email !== undefined) vendor.email = updateData.email;
    if (updateData.gstin !== undefined) vendor.gstin = updateData.gstin;
    if (updateData.accountId !== undefined) vendor.accountId = updateData.accountId;
    
    vendor.updatedBy = updatedBy;
    vendor.updatedAt = getCurrentISTDate();

    return await this.vendorRepo.update(vendor, orgId);
  }
}
