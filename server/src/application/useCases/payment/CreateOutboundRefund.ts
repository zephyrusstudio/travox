import { injectable, inject } from 'tsyringe';
import { IPaymentRepository } from '../../repositories/IPaymentRepository';
import { IVendorRepository } from '../../repositories/IVendorRepository';
import { Payment } from '../../../domain/Payment';
import { PaymentMode } from '../../../models/FirestoreTypes';

interface CreateOutboundRefundDTO {
  vendorId: string;
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
export class CreateOutboundRefund {
  constructor(
    @inject('IPaymentRepository') private paymentRepo: IPaymentRepository,
    @inject('IVendorRepository') private vendorRepo: IVendorRepository
  ) {}

  async execute(data: CreateOutboundRefundDTO, orgId: string, createdBy: string): Promise<Payment> {
    // Validate required fields
    if (!data.vendorId) {
      throw new Error('Vendor ID is required for outbound refunds');
    }

    if (data.amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    // Verify vendor exists
    const vendor = await this.vendorRepo.findById(data.vendorId, orgId);
    if (!vendor) {
      throw new Error('Vendor not found');
    }

    // Create outbound refund payment
    const payment = Payment.createOutboundRefund(
      orgId,
      data.vendorId,
      data.amount,
      data.currency,
      data.paymentMode,
      createdBy,
      data.bookingId,
      {
        category: data.category,
        notes: data.notes,
        receiptNo: data.receiptNo,
        fromAccountId: data.fromAccountId,
        toAccountId: data.toAccountId,
      }
    );

    // Save payment - outbound refunds don't impact customer due/paid amounts
    // unless reconciled via a separate receivable/refund to the customer
    return await this.paymentRepo.create(payment, orgId);
  }
}
