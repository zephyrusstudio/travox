import { Payment } from '../../domain/Payment';
import { PaymentType } from '../../models/FirestoreTypes';

export interface IPaymentRepository {
  create(payment: Payment, orgId: string): Promise<Payment>;
  findById(id: string, orgId: string): Promise<Payment | null>;
  findByBookingId(bookingId: string, orgId: string): Promise<Payment[]>;
  findByCustomerId(customerId: string, orgId: string): Promise<Payment[]>;
  findByVendorId(vendorId: string, orgId: string): Promise<Payment[]>;
  findByType(paymentType: PaymentType, orgId: string): Promise<Payment[]>;
  update(payment: Payment, orgId: string): Promise<Payment>;
  delete(id: string, orgId: string): Promise<boolean>;
  findAll(orgId: string, limit?: number, offset?: number, paymentType?: PaymentType): Promise<Payment[]>;
  countAll(orgId: string, paymentType?: PaymentType): Promise<number>;
  getTotalReceivablesByBooking(bookingId: string, orgId: string): Promise<number>;
  getTotalExpensesByVendor(vendorId: string, orgId: string): Promise<number>;
  getTotalRefundsByBooking(bookingId: string, orgId: string): Promise<{ inbound: number; outbound: number }>;
  
  // Cache management
  invalidateCacheForPayment(paymentId: string, orgId: string): Promise<void>;
  invalidateCacheForBookingPayments(bookingId: string, orgId: string): Promise<void>;
}
