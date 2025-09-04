import { injectable, inject } from 'tsyringe';
import { IVendorRepository } from '../../repositories/IVendorRepository';

@injectable()
export class DeleteVendor {
  constructor(
    @inject('IVendorRepository') private vendorRepo: IVendorRepository
  ) {}

  async softDelete(id: string, orgId: string, updatedBy: string): Promise<boolean> {
    return await this.vendorRepo.softDelete(id, orgId, updatedBy);
  }

  async delete(id: string, orgId: string): Promise<boolean> {
    return await this.vendorRepo.delete(id, orgId);
  }
}
