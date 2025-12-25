import { injectable, inject } from 'tsyringe';
import { IPaymentRepository } from '../../repositories/IPaymentRepository';
import { ICustomerRepository } from '../../repositories/ICustomerRepository';
import { IBookingRepository } from '../../repositories/IBookingRepository';
import { Payment } from '../../../domain/Payment';

interface CreateOutboundRefundDTO {
  refundOfPaymentId: string;
  category?: string;
  notes?: string;
  receiptNo?: string;
  fromAccountId?: string;
}

@injectable()
export class CreateOutboundRefund {
  constructor(
    @inject('IPaymentRepository') private paymentRepo: IPaymentRepository,
    @inject('ICustomerRepository') private customerRepo: ICustomerRepository,
    @inject('IBookingRepository') private bookingRepo: IBookingRepository
  ) {}

  async execute(data: CreateOutboundRefundDTO, orgId: string, createdBy: string): Promise<Payment> {
    const originalPayment = await this.paymentRepo.findById(data.refundOfPaymentId, orgId);
    if (!originalPayment) {
      throw new Error('Original receivable payment not found');
    }

    const customerId = originalPayment.customerId;
    const bookingId = originalPayment.bookingId;
    const amount = originalPayment.amount;
    const currency = originalPayment.currency;
    const paymentMode = originalPayment.paymentMode;
    const toAccountId = originalPayment.fromAccountId;

    if (!customerId) {
      throw new Error('Original payment must have a customer ID');
    }

    // Verify customer exists
    const customer = await this.customerRepo.findById(customerId, orgId);
    if (!customer) {
      throw new Error('Customer not found');
    }

    // Create outbound refund payment
    const payment = Payment.createOutboundRefund(
      orgId,
      customerId,
      amount,
      currency,
      paymentMode,
      createdBy,
      data.refundOfPaymentId,
      bookingId,
      {
        category: data.category,
        notes: data.notes,
        receiptNo: data.receiptNo,
        fromAccountId: originalPayment.toAccountId,
        toAccountId: toAccountId,
      }
    );

    // Save payment
    const savedPayment = await this.paymentRepo.create(payment, orgId);

    // Decrease customer's total spent for outbound refunds
    customer.deductFromTotalSpent(amount);
    await this.customerRepo.update(customer, orgId);

    // Update booking's paid amount if refund is linked to a booking
    if (bookingId) {
      const booking = await this.bookingRepo.findById(bookingId, orgId);
      if (booking) {
        booking.deductPayment(amount, createdBy);
        await this.bookingRepo.update(booking, orgId);
      }
    }

    return savedPayment;
  }
}
