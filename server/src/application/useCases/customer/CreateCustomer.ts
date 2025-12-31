import { injectable, inject } from 'tsyringe';
import { ICustomerRepository } from '../../repositories/ICustomerRepository';
import { Customer } from '../../../domain/Customer';
import { CreateAccount } from '../account/CreateAccount';

interface CreateCustomerDTO {
  name: string;
  phone?: string;
  email?: string;
  passportNo?: string;
  aadhaarNo?: string;
  visaNo?: string;
  gstin?: string;
  accountId?: string;
}

const PLACEHOLDER_ACCOUNT_NO = '0000000000';
const PLACEHOLDER_IFSC = 'PLHR0000000';
const PLACEHOLDER_UPI = 'placeholder@upi';

@injectable()
export class CreateCustomer {
  private static readonly DEFAULT_EMAIL = 'esanchar@gmail.com';
  private static readonly DEFAULT_PHONE = '+91-9332100486';

  constructor(
    @inject('ICustomerRepository') private customerRepo: ICustomerRepository,
    @inject(CreateAccount) private createAccount: CreateAccount
  ) {}

  async execute(data: CreateCustomerDTO, orgId: string, createdBy: string): Promise<Customer> {
    // Validate mandatory fields - only name is required
    if (!data.name?.trim()) {
      throw new Error('Customer name is required');
    }

    // Auto-fill missing email or phone with placeholders
    if (!data.email?.trim()) {
      data.email = CreateCustomer.DEFAULT_EMAIL;
    }

    if (!data.phone?.trim()) {
      data.phone = CreateCustomer.DEFAULT_PHONE;
    }

    // Validate Aadhaar format (12 digits) - optional
    if (data.aadhaarNo && !this.isValidAadhaar(data.aadhaarNo)) {
      throw new Error('Aadhaar number must be exactly 12 digits');
    }

    // Validate GSTIN format (15 characters) - optional
    if (data.gstin && !this.isValidGSTIN(data.gstin)) {
      throw new Error('GSTIN must be exactly 15 characters');
    }

    // Validate if customer already exists (skip validation for default email/phone)
    if (data.email && data.email !== CreateCustomer.DEFAULT_EMAIL) {
      const existingByEmail = await this.customerRepo.findByEmail(data.email, orgId);
      if (existingByEmail) {
        throw new Error('Customer with this email already exists');
      }
    }

    if (data.phone && data.phone !== CreateCustomer.DEFAULT_PHONE) {
      const existingByPhone = await this.customerRepo.findByPhone(data.phone, orgId);
      if (existingByPhone) {
        throw new Error('Customer with this phone already exists');
      }
    }

    // Create placeholder bank account for the customer
    const placeholderAccount = await this.createAccount.execute(
      {
        accountNo: PLACEHOLDER_ACCOUNT_NO,
        ifscCode: PLACEHOLDER_IFSC,
        upiId: PLACEHOLDER_UPI,
      },
      orgId,
      createdBy
    );

    // Create new customer with linked account
    const customer = Customer.create(orgId, data.name.trim(), createdBy, {
      phone: data.phone?.trim(),
      email: data.email?.trim(),
      passportNo: data.passportNo?.trim(),
      aadhaarNo: data.aadhaarNo?.trim(),
      visaNo: data.visaNo?.trim(),
      gstin: data.gstin?.trim().toUpperCase(),
      accountId: placeholderAccount.id,
    });

    return await this.customerRepo.create(customer, orgId);
  }

  private isValidAadhaar(aadhaar: string): boolean {
    // Aadhaar should be exactly 12 digits
    return /^\d{12}$/.test(aadhaar);
  }

  private isValidGSTIN(gstin: string): boolean {
    // GSTIN should be exactly 15 characters
    return /^[0-9A-Z]{15}$/.test(gstin.toUpperCase());
  }
}
