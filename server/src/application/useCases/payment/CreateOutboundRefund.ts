import { injectable, inject } from 'tsyringe';
import { IPaymentRepository } from '../../repositories/IPaymentRepository';
import { IVendorRepository } from '../../repositories/IVendorRepository';
import { ICustomerRepository } from '../../repositories/ICustomerRepository';
import { IBookingRepository } from '../../repositories/IBookingRepository';
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
    @inject('IVendorRepository') private vendorRepo: IVendorRepository,
    @inject('ICustomerRepository') private customerRepo: ICustomerRepository,
    @inject('IBookingRepository') private bookingRepo: IBookingRepository
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
    const savedPayment = await this.paymentRepo.create(payment, orgId);

    // If this refund is associated with a booking, get the customer and update totalSpent
    if (data.bookingId) {
      const booking = await this.bookingRepo.findById(data.bookingId, orgId);
      if (booking) {
        const customer = await this.customerRepo.findById(booking.customerId, orgId);
        if (customer) {
          customer.deductFromTotalSpent(data.amount);
          await this.customerRepo.update(customer, orgId);
        }
      }
    }

    return savedPayment;
  }
}
