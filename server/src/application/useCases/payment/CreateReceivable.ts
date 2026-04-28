import { injectable, inject } from 'tsyringe';
import { IPaymentRepository } from '../../repositories/IPaymentRepository';
import { IBookingRepository } from '../../repositories/IBookingRepository';
import { ICustomerRepository } from '../../repositories/ICustomerRepository';
import { Payment } from '../../../domain/Payment';
import { BookingStatus, PaymentMode, PaymentType } from '../../../models/FirestoreTypes';
import { RedisService } from '../../../infrastructure/services/RedisService';
import { Booking } from '../../../domain/Booking';

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

    if (booking.status === BookingStatus.CANCELLED || booking.status === BookingStatus.REFUNDED) {
      throw new Error(`Cannot record payment for a ${booking.status.toLowerCase()} booking`);
    }

    const financials = await this.getBookingFinancials(booking, orgId);

    // CRITICAL: Validate against reconciled due amount, not a stale denormalized field.
    if (data.amount > financials.dueAmount) {
      throw new Error(
        `Payment amount (${data.amount}) exceeds booking due amount (${financials.dueAmount}). ` +
        `Total: ${booking.totalAmount}, Paid: ${financials.paidAmount}, Due: ${financials.dueAmount}`
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

    // Update booking from reconciled state so old/stale due values self-heal.
    booking.paidAmount = financials.paidAmount;
    booking.dueAmount = financials.dueAmount;
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

  private async getBookingFinancials(booking: Booking, orgId: string): Promise<{
    paidAmount: number;
    dueAmount: number;
  }> {
    const payments = await this.paymentRepo.findByBookingId(booking.id, orgId);
    const receivableTotal = payments
      .filter(payment => payment.paymentType === PaymentType.RECEIVABLE)
      .reduce((sum, payment) => sum + payment.amount, 0);
    const refundTotal = payments
      .filter(payment => payment.paymentType === PaymentType.REFUND_OUTBOUND)
      .reduce((sum, payment) => sum + payment.amount, 0);
    const storedPaidAmount = Math.max(0, Number(booking.paidAmount || 0));
    const grossPaidFromStored = storedPaidAmount > receivableTotal
      ? storedPaidAmount + refundTotal
      : storedPaidAmount;
    const grossPaidAmount = this.round(Math.max(receivableTotal, grossPaidFromStored));
    const paidAmount = this.round(Math.max(0, grossPaidAmount - refundTotal));
    const dueAmount = this.round(Math.max(0, booking.totalAmount - grossPaidAmount));

    return { paidAmount, dueAmount };
  }

  private round(value: number): number {
    return Number(value.toFixed(2));
  }
}
