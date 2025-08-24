import { injectable, inject } from 'tsyringe';
import { IPaymentRepository } from './Repositories/IPaymentRepository';
import { IVendorRepository } from './Repositories/IVendorRepository';
import { Payment } from '../domain/Payment';
import { PaymentMode } from '../models/FirestoreTypes';

interface CreateExpenseDTO {
  vendorId?: string;
  bookingId?: string;
  amount: number;
  currency: string;
  paymentMode: PaymentMode;
  category?: string;
  notes?: string;
  receiptNo?: string;
  fromAccountId?: string;
  toAccountId?: string;
}

@injectable()
export class CreateExpense {
  constructor(
    @inject('IPaymentRepository') private paymentRepo: IPaymentRepository,
    @inject('IVendorRepository') private vendorRepo: IVendorRepository
  ) {}

  async execute(data: CreateExpenseDTO, orgId: string, createdBy: string): Promise<Payment> {
    // Validate required fields
    if (data.amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    // Verify vendor exists if provided
    if (data.vendorId) {
      const vendor = await this.vendorRepo.findById(data.vendorId, orgId);
      if (!vendor) {
        throw new Error('Vendor not found');
      }
    }

    // Create expense payment
    const payment = Payment.createExpense(
      orgId,
      data.amount,
      data.currency,
      data.paymentMode,
      createdBy,
      data.vendorId,
      data.bookingId,
      {
        category: data.category,
        notes: data.notes,
        receiptNo: data.receiptNo,
        fromAccountId: data.fromAccountId,
        toAccountId: data.toAccountId,
      }
    );

    // Save payment
    const savedPayment = await this.paymentRepo.create(payment, orgId);

    // Update vendor total expense if vendor is specified
    if (data.vendorId) {
      const vendor = await this.vendorRepo.findById(data.vendorId, orgId);
      if (vendor) {
        vendor.addExpense(data.amount);
        await this.vendorRepo.update(vendor, orgId);
      }
    }

    return savedPayment;
  }
}
