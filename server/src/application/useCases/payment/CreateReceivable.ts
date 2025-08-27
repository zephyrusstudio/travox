import { injectable, inject } from 'tsyringe';
import { IPaymentRepository } from '../../repositories/IPaymentRepository';
import { IBookingRepository } from '../../repositories/IBookingRepository';
import { Payment } from '../../../domain/Payment';
import { PaymentMode } from '../../../models/FirestoreTypes';

interface CreateReceivableDTO {
  bookingId: string;
  customerId?: string;
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
export class CreateReceivable {
  constructor(
    @inject('IPaymentRepository') private paymentRepo: IPaymentRepository,
    @inject('IBookingRepository') private bookingRepo: IBookingRepository
  ) {}

  async execute(data: CreateReceivableDTO, orgId: string, createdBy: string): Promise<Payment> {
    // Validate required fields
    if (!data.bookingId) {
      throw new Error('Booking ID is required for receivables');
    }

    if (data.amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    // Verify booking exists
    const booking = await this.bookingRepo.findById(data.bookingId, orgId);
    if (!booking) {
      throw new Error('Booking not found');
    }

    // Use customer from booking if not provided
    const customerId = data.customerId || booking.customerId;

    // Create receivable payment
    const payment = Payment.createReceivable(
      orgId,
      data.bookingId,
      data.amount,
      data.currency,
      data.paymentMode,
      createdBy,
      customerId,
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

    // Update booking paid amount
    booking.addPayment(data.amount, createdBy);
    await this.bookingRepo.update(booking, orgId);

    return savedPayment;
  }
}
