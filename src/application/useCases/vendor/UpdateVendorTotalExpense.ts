import { injectable, inject } from 'tsyringe';
import { IVendorRepository } from '../../repositories/IVendorRepository';
import { IPaymentRepository } from '../../repositories/IPaymentRepository';

@injectable()
export class UpdateVendorTotalExpense {
  constructor(
    @inject('IVendorRepository') private vendorRepo: IVendorRepository,
    @inject('IPaymentRepository') private paymentRepo: IPaymentRepository
  ) {}

  /**
   * Update vendor total expense by calculating SUM(expense/payable) from payments
   * This can be run as a nightly job or live calculation
   */
  async execute(vendorId: string, orgId: string): Promise<number> {
    // Get vendor
    const vendor = await this.vendorRepo.findById(vendorId, orgId);
    if (!vendor) {
      throw new Error('Vendor not found');
    }

    // Calculate total expenses for this vendor
    const totalExpense = await this.paymentRepo.getTotalExpensesByVendor(vendorId, orgId);

    // Update vendor
    vendor.totalExpense = totalExpense;
    vendor.updatedAt = new Date();
    await this.vendorRepo.update(vendor, orgId);

    return totalExpense;
  }

  /**
   * Update total expenses for all vendors in an organization
   * Can be used for nightly batch jobs
   */
  async executeForAllVendors(orgId: string): Promise<void> {
    const vendors = await this.vendorRepo.findAll(orgId);
    
    for (const vendor of vendors) {
      try {
        await this.execute(vendor.id, orgId);
      } catch (error) {
        console.error(`Failed to update total expense for vendor ${vendor.id}:`, error);
      }
    }
  }
}
