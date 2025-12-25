import { PaymentType, PaymentMode } from '../models/FirestoreTypes';

export class Payment {
  constructor(
    public id: string,
    public orgId: string,
    public paymentType: PaymentType,
    public amount: number,
    public currency: string,
    public paymentMode: PaymentMode,
    public createdBy: string,
    public updatedBy: string,
    public isDeleted: boolean = false,
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date(),
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
    public archivedAt?: Date
  ) {}

  static createReceivable(
    orgId: string,
    bookingId: string,
    amount: number,
    currency: string,
    paymentMode: PaymentMode,
    createdBy: string,
    customerId: string,
    fromAccountId: string,
    options?: {
      category?: string;
      notes?: string;
      receiptNo?: string;
      toAccountId?: string;
    }
  ): Payment {
    if (!bookingId) {
      throw new Error('Booking ID is required for receivables');
    }

    if (!fromAccountId) {
      throw new Error('From account ID is required for receivables');
    }

    const now = new Date();
    return new Payment(
      '',
      orgId,
      PaymentType.RECEIVABLE,
      amount,
      currency,
      paymentMode,
      createdBy,
      createdBy,
      false,
      now,
      now,
      bookingId,
      customerId,
      undefined,
      undefined,
      undefined,
      options?.category,
      options?.notes,
      options?.receiptNo,
      fromAccountId,
      options?.toAccountId
    );
  }

  static createExpense(
    orgId: string,
    amount: number,
    currency: string,
    paymentMode: PaymentMode,
    createdBy: string,
    toAccountId: string,
    vendorId?: string,
    options?: {
      bookingId?: string;
      category?: string;
      notes?: string;
      receiptNo?: string;
      fromAccountId?: string;
    }
  ): Payment {
    if (!toAccountId) {
      throw new Error('To account ID is required for expenses');
    }

    const now = new Date();
    return new Payment(
      '',
      orgId,
      PaymentType.EXPENSE,
      amount,
      currency,
      paymentMode,
      createdBy,
      createdBy,
      false,
      now,
      now,
      options?.bookingId,
      undefined,
      vendorId, 
      undefined,
      undefined,
      options?.category,
      options?.notes,
      options?.receiptNo,
      options?.fromAccountId,
      toAccountId
    );
  }

  static createInboundRefund(
    orgId: string,
    amount: number,
    currency: string,
    paymentMode: PaymentMode,
    createdBy: string,
    vendorId: string,
    refundOfPaymentId: string,
    options?: {
      category?: string;
      notes?: string;
      receiptNo?: string;
      fromAccountId?: string;
      toAccountId?: string;
    }
  ): Payment {
    if (!refundOfPaymentId) {
      throw new Error('Expense payment ID is required for inbound refunds');
    }

    const now = new Date();
    return new Payment(
      '',
      orgId,
      PaymentType.REFUND_INBOUND,
      amount,
      currency,
      paymentMode,
      createdBy,
      createdBy,
      false,
      now,
      now,
      undefined,          // bookingId
      vendorId,           // customerId (stores vendorId for inbound refunds)
      undefined,          // vendorId
      undefined,          // relatedInvoiceId
      refundOfPaymentId,  // refundOfPaymentId - FIXED: was incorrectly at position 14
      options?.category,
      options?.notes,
      options?.receiptNo,
      options?.fromAccountId,
      options?.toAccountId
    );
  }

  static createOutboundRefund(
    orgId: string,
    customerId: string,
    amount: number,
    currency: string,
    paymentMode: PaymentMode,
    createdBy: string,
    refundOfPaymentId: string,
    bookingId?: string,
    options?: {
      category?: string;
      notes?: string;
      receiptNo?: string;
      fromAccountId?: string;
      toAccountId?: string;
    }
  ): Payment {
    if (!customerId) {
      throw new Error('Customer ID is required for outbound refunds');
    }

    if (!refundOfPaymentId) {
      throw new Error('Receivable payment ID is required for outbound refunds');
    }

    const now = new Date();
    return new Payment(
      '',
      orgId,
      PaymentType.REFUND_OUTBOUND,
      amount,
      currency,
      paymentMode,
      createdBy,
      createdBy,
      false,
      now,
      now,
      bookingId,
      customerId,
      undefined,
      undefined,
      refundOfPaymentId,
      options?.category,
      options?.notes,
      options?.receiptNo,
      options?.fromAccountId,
      options?.toAccountId
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
