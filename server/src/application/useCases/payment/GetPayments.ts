
import { injectable, inject } from 'tsyringe';
import { IPaymentRepository } from '../../repositories/IPaymentRepository';
import { IBookingRepository } from '../../repositories/IBookingRepository';
import { PaymentType } from '../../../models/FirestoreTypes';
import { PaymentMode } from '../../../models/FirestoreTypes';

export type PaymentListItem = {
  id: string;
  orgId: string;
  paymentType: PaymentType;
  amount: number;
  currency: string;
  paymentMode: PaymentMode;
  createdBy: string;
  updatedBy: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  bookingId?: string;
  customerId?: string;
  vendorId?: string;
  relatedInvoiceId?: string;
  refundOfPaymentId?: string;
  category?: string;
  notes?: string;
  receiptNo?: string;
  fromAccountId?: string;
  toAccountId?: string;
  archivedAt?: Date;
  pnrNo?: string | null;
};

@injectable()
export class GetPayments {
  constructor(
    @inject('IPaymentRepository') private paymentRepo: IPaymentRepository,
    @inject('IBookingRepository') private bookingRepo: IBookingRepository
  ) {}

  private toListItem(payment: Awaited<ReturnType<IPaymentRepository['findAll']>>[number], pnrNo: string | null): PaymentListItem {
    return {
      id: payment.id,
      orgId: payment.orgId,
      paymentType: payment.paymentType,
      amount: payment.amount,
      currency: payment.currency,
      paymentMode: payment.paymentMode,
      createdBy: payment.createdBy,
      updatedBy: payment.updatedBy,
      isDeleted: payment.isDeleted,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
      bookingId: payment.bookingId,
      customerId: payment.customerId,
      vendorId: payment.vendorId,
      relatedInvoiceId: payment.relatedInvoiceId,
      refundOfPaymentId: payment.refundOfPaymentId,
      category: payment.category,
      notes: payment.notes,
      receiptNo: payment.receiptNo,
      fromAccountId: payment.fromAccountId,
      toAccountId: payment.toAccountId,
      archivedAt: payment.archivedAt,
      pnrNo,
    };
  }

  async execute(
    orgId: string,
    limit?: number,
    offset?: number,
    paymentType?: PaymentType
  ): Promise<PaymentListItem[]> {
    const payments = await this.paymentRepo.findAll(orgId, limit, offset, paymentType);

    const bookingIds = Array.from(
      new Set(
        payments
          .map((payment) => payment.bookingId)
          .filter((bookingId): bookingId is string => Boolean(bookingId))
      )
    );

    if (bookingIds.length === 0) {
      return payments.map((payment) => this.toListItem(payment, null));
    }

    const bookings = await Promise.all(
      bookingIds.map((bookingId) => this.bookingRepo.findById(bookingId, orgId))
    );

    const bookingsById = new Map(
      bookings
        .filter((booking): booking is NonNullable<typeof booking> => Boolean(booking))
        .map((booking) => [booking.id, booking])
    );

    return payments.map((payment) =>
      this.toListItem(
        payment,
        payment.bookingId ? bookingsById.get(payment.bookingId)?.pnrNo ?? null : null
      )
    );
  }

  async count(orgId: string, paymentType?: PaymentType): Promise<number> {
    return await this.paymentRepo.countAll(orgId, paymentType);
  }
}
