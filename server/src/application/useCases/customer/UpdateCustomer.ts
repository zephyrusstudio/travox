import { injectable, inject } from 'tsyringe';
import { ICustomerRepository } from '../../repositories/ICustomerRepository';
import { Customer } from '../../../domain/Customer';
import { getCurrentISTDate } from '../../../utils/timezone';

interface UpdateCustomerDTO {
  name?: string;
  phone?: string;
  email?: string;
  passportNo?: string;
  aadhaarNo?: string;
  visaNo?: string;
  gstin?: string;
  accountId?: string;
}

@injectable()
export class UpdateCustomer {
  private static readonly DEFAULT_EMAIL = 'esanchar@gmail.com';
  private static readonly DEFAULT_PHONE = '+91-9332100486';

  constructor(
    @inject('ICustomerRepository') private customerRepo: ICustomerRepository
  ) {}

  async execute(customerId: string, data: UpdateCustomerDTO, orgId: string, updatedBy: string): Promise<Customer> {
    // Find existing customer
    const existingCustomer = await this.customerRepo.findById(customerId, orgId);
    if (!existingCustomer) {
      throw new Error('Customer not found');
    }

    // Validate if email conflicts with another customer
    if (data.email !== UpdateCustomer.DEFAULT_EMAIL && data.email && data.email !== existingCustomer.email) {
      const existingByEmail = await this.customerRepo.findByEmail(data.email, orgId);
      if (existingByEmail && existingByEmail.id !== customerId) {
        throw new Error('Customer with this email already exists');
      }
    }

    // Validate if phone conflicts with another customer
    if (data.phone !== UpdateCustomer.DEFAULT_PHONE && data.phone && data.phone !== existingCustomer.phone) {
      const existingByPhone = await this.customerRepo.findByPhone(data.phone, orgId);
      if (existingByPhone && existingByPhone.id !== customerId) {
        throw new Error('Customer with this phone already exists');
      }
    }

    // Update customer properties
    if (data.name) existingCustomer.name = data.name.trim();
    if (data.phone !== undefined) existingCustomer.phone = data.phone?.trim();
    if (data.email !== undefined) existingCustomer.email = data.email?.trim();
    if (data.passportNo !== undefined) existingCustomer.passportNo = data.passportNo?.trim();
    if (data.aadhaarNo !== undefined) existingCustomer.aadhaarNo = data.aadhaarNo?.trim();
    if (data.visaNo !== undefined) existingCustomer.visaNo = data.visaNo?.trim();
    if (data.gstin !== undefined) existingCustomer.gstin = data.gstin?.trim().toUpperCase();
    if (data.accountId !== undefined) existingCustomer.accountId = data.accountId;

    existingCustomer.updatedAt = getCurrentISTDate();
    existingCustomer.updatedBy = updatedBy;

    return await this.customerRepo.update(existingCustomer, orgId);
  }
}
