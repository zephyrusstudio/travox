import { injectable, inject } from 'tsyringe';
import { IPaymentRepository } from '../../repositories/IPaymentRepository';
import { IVendorRepository } from '../../repositories/IVendorRepository';
import { Payment } from '../../../domain/Payment';
import { PaymentMode } from '../../../models/FirestoreTypes';

interface CreateExpenseDTO {
  amount: number;
  currency: string;
  paymentMode: PaymentMode;
  toAccountId: string;
  bookingId?: string;
  category?: string;
  notes?: string;
  receiptNo?: string;
  fromAccountId?: string;
}

@injectable()
export class CreateExpense {
  constructor(
    @inject('IPaymentRepository') private paymentRepo: IPaymentRepository,
    @inject('IVendorRepository') private vendorRepo: IVendorRepository
  ) {}

  async execute(data: CreateExpenseDTO, orgId: string, createdBy: string): Promise<Payment> {
    if (data.amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    if (!data.toAccountId) {
      throw new Error('To account ID is required');
    }
    
    const vendor = await this.vendorRepo.findByAccountId(data.toAccountId, orgId);
    if (!vendor) {
      throw new Error('No vendor found for the specified account');
    }

    const payment = Payment.createExpense(
      orgId,
      data.amount,
      data.currency,
      data.paymentMode,
      createdBy,
      data.toAccountId,
      vendor.id,
      {
        bookingId: data.bookingId,
        category: data.category,
        notes: data.notes,
        receiptNo: data.receiptNo,
        fromAccountId: data.fromAccountId,
      }
    );

    const savedPayment = await this.paymentRepo.create(payment, orgId);

    vendor.addExpense(data.amount);
    await this.vendorRepo.update(vendor, orgId);

    return savedPayment;
  }
}
