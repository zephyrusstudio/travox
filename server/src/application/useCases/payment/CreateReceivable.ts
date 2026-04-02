import { injectable, inject } from 'tsyringe';
import { IPaymentRepository } from '../../repositories/IPaymentRepository';
import { IBookingRepository } from '../../repositories/IBookingRepository';
import { ICustomerRepository } from '../../repositories/ICustomerRepository';
import { Payment } from '../../../domain/Payment';
import { PaymentMode } from '../../../models/FirestoreTypes';
import { RedisService } from '../../../infrastructure/services/RedisService';

interface CreateReceivableDTO {
  bookingId: string;
  amount: number;
  currency: string;
  paymentMode: PaymentMode;
  fromAccountId: string;
  category?: string;
  notes?: string;
  receiptNo?: string;
  toAccountId?: string;
}

@injectable()
export class CreateReceivable {
  constructor(
    @inject('IPaymentRepository') private paymentRepo: IPaymentRepository,
    @inject('IBookingRepository') private bookingRepo: IBookingRepository,
    @inject('ICustomerRepository') private customerRepo: ICustomerRepository,
    @inject('RedisService') private cache: RedisService
  ) {}

  async execute(data: CreateReceivableDTO, orgId: string, createdBy: string): Promise<Payment> {
    // Validate required fields
    if (!data.bookingId) {
      throw new Error('Booking ID is required for receivables');
    }

    if (data.amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    // CRITICAL: Invalidate cache first to prevent race conditions
    // This ensures we always get fresh data from Firestore
    await this.bookingRepo.invalidateCacheForBooking(data.bookingId, orgId);

    // Verify booking exists - now with fresh data
    const booking = await this.bookingRepo.findById(data.bookingId, orgId);
    if (!booking) {
      throw new Error('Booking not found');
    }

    // CRITICAL: Validate payment won't exceed due amount to prevent overpayments
    if (data.amount > booking.dueAmount) {
      throw new Error(
        `Payment amount (${data.amount}) exceeds booking due amount (${booking.dueAmount}). ` +
        `Total: ${booking.totalAmount}, Paid: ${booking.paidAmount}, Due: ${booking.dueAmount}`
      );
    }

    // Derive customer ID from fromAccountId
    if (!data.fromAccountId) {
      throw new Error('From account ID is required');
    }
    
    const customer = await this.customerRepo.findByAccountId(data.fromAccountId, orgId);
    if (!customer) {
      throw new Error('No customer found for the specified account');
    }
    
    // CRITICAL: Invalidate customer cache to ensure fresh totalSpent data
    await this.customerRepo.invalidateCacheForCustomer(customer.id, orgId);

    // Create receivable payment
    const payment = Payment.createReceivable(
      orgId,
      data.bookingId,
      data.amount,
      data.currency,
      data.paymentMode,
      createdBy,
      customer.id,
      data.fromAccountId,
      {
        category: data.category,
        notes: data.notes,
        receiptNo: data.receiptNo,
        toAccountId: data.toAccountId,
      }
    );

    // Save payment
    const savedPayment = await this.paymentRepo.create(payment, orgId);

    // Update booking paid amount
    booking.addPayment(data.amount, createdBy);
    await this.bookingRepo.update(booking, orgId);

    // Update customer's total spent
    customer.addToTotalSpent(data.amount);
    await this.customerRepo.update(customer, orgId);

    // Invalidate customer booking report caches for immediate report refresh
    await this.cache.invalidatePattern(`report:customers:bookings:${orgId}:*`);
    await this.cache.invalidatePattern(`report:center:${orgId}:*`);

    return savedPayment;
  }
}
