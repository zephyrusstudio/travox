import { PaymentType, PaymentMode } from '../models/FirestoreTypes';

export class Payment {
  constructor(
    public id: string,
    public orgId: string,
    public amount: number,
    public currency: string,
    public paymentType: PaymentType,
    public paymentMode: PaymentMode,
    public bookingId?: string,
    public customerId?: string,
    public vendorId?: string,
    public relatedInvoiceId?: string,
    public refundOfPaymentId?: string,
    public category?: string,
    public notes?: string,
    public receiptNo?: string,
    public fromAccountId?: string,
    public toAccountId?: string,
    public createdBy: string = '',
    public updatedBy: string = '',
    public isDeleted: boolean = false,
    public archivedAt?: Date,
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {}

  static createReceivable(
    orgId: string,
    bookingId: string,
    amount: number,
    currency: string,
    paymentMode: PaymentMode,
    createdBy: string,
    customerId?: string,
    options?: {
      category?: string;
      notes?: string;
      receiptNo?: string;
      fromAccountId?: string;
      toAccountId?: string;
    }
  ): Payment {
    if (!bookingId) {
      throw new Error('Booking ID is required for receivables');
    }

    const now = new Date();
    return new Payment(
      '',
      orgId,
      amount,
      currency,
      PaymentType.RECEIVABLE,
      paymentMode,
      bookingId,
      customerId,
      undefined,
      undefined,
      undefined,
      options?.category,
      options?.notes,
      options?.receiptNo,
      options?.fromAccountId,
      options?.toAccountId,
      createdBy,
      createdBy,
      false,
      undefined,
      now,
      now
    );
  }

  static createExpense(
    orgId: string,
    amount: number,
    currency: string,
    paymentMode: PaymentMode,
    createdBy: string,
    vendorId?: string,
    bookingId?: string,
    options?: {
      category?: string;
      notes?: string;
      receiptNo?: string;
      fromAccountId?: string;
      toAccountId?: string;
    }
  ): Payment {
    const now = new Date();
    return new Payment(
      '',
      orgId,
      amount,
      currency,
      PaymentType.EXPENSE,
      paymentMode,
      bookingId,
      undefined,
      vendorId,
      undefined,
      undefined,
      options?.category,
      options?.notes,
      options?.receiptNo,
      options?.fromAccountId,
      options?.toAccountId,
      createdBy,
      createdBy,
      false,
      undefined,
      now,
      now
    );
  }

  static createInboundRefund(
    orgId: string,
    bookingId: string,
    amount: number,
    currency: string,
    paymentMode: PaymentMode,
    createdBy: string,
    customerId?: string,
    options?: {
      category?: string;
      notes?: string;
      receiptNo?: string;
      fromAccountId?: string;
      toAccountId?: string;
    }
  ): Payment {
    if (!bookingId) {
      throw new Error('Booking ID is required for inbound refunds');
    }

    const now = new Date();
    return new Payment(
      '',
      orgId,
      amount,
      currency,
      PaymentType.REFUND_INBOUND,
      paymentMode,
      bookingId,
      customerId,
      undefined,
      undefined,
      undefined,
      options?.category,
      options?.notes,
      options?.receiptNo,
      options?.fromAccountId,
      options?.toAccountId,
      createdBy,
      createdBy,
      false,
      undefined,
      now,
      now
    );
  }

  static createOutboundRefund(
    orgId: string,
    vendorId: string,
    amount: number,
    currency: string,
    paymentMode: PaymentMode,
    createdBy: string,
    bookingId?: string,
    options?: {
      category?: string;
      notes?: string;
      receiptNo?: string;
      fromAccountId?: string;
      toAccountId?: string;
    }
  ): Payment {
    if (!vendorId) {
      throw new Error('Vendor ID is required for outbound refunds');
    }

    const now = new Date();
    return new Payment(
      '',
      orgId,
      amount,
      currency,
      PaymentType.REFUND_OUTBOUND,
      paymentMode,
      bookingId,
      undefined,
      vendorId,
      undefined,
      undefined,
      options?.category,
      options?.notes,
      options?.receiptNo,
      options?.fromAccountId,
      options?.toAccountId,
      createdBy,
      createdBy,
      false,
      undefined,
      now,
      now
    );
  }

  updateNotes(notes: string, updatedBy: string): void {
    this.notes = notes;
    this.updatedBy = updatedBy;
    this.updatedAt = new Date();
  }

  updateCategory(category: string, updatedBy: string): void {
    this.category = category;
    this.updatedBy = updatedBy;
    this.updatedAt = new Date();
  }

  archive(updatedBy: string): void {
    this.archivedAt = new Date();
    this.updatedBy = updatedBy;
    this.updatedAt = new Date();
  }

  softDelete(updatedBy: string): void {
    this.isDeleted = true;
    this.updatedBy = updatedBy;
    this.updatedAt = new Date();
  }
}
