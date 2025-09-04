
import { injectable } from 'tsyringe';
import { IPaymentRepository } from '../../application/repositories/IPaymentRepository';
import { Payment } from '../../domain/Payment';
import { PaymentDocument, PaymentType } from '../../models/FirestoreTypes';
import { firestore } from '../../config/firestore';
import { Timestamp } from 'firebase-admin/firestore';

const PAYMENTS_COLLECTION = 'payments';

@injectable()
export class PaymentRepositoryFirestore implements IPaymentRepository {
  private collection = firestore.collection(PAYMENTS_COLLECTION);

  async create(payment: Payment, orgId: string): Promise<Payment> {
    const now = Timestamp.now();
    const docData: any = {
      org_id: orgId,
      payment_type: payment.paymentType,
      amount: payment.amount,
      currency: payment.currency,
      payment_mode: payment.paymentMode,
      created_by: payment.createdBy,
      updated_by: payment.updatedBy,
      is_deleted: payment.isDeleted,
      created_at: now,
      updated_at: now,
    };

    if (payment.bookingId) docData.booking_id = payment.bookingId;
    if (payment.customerId) docData.customer_id = payment.customerId;
    if (payment.vendorId) docData.vendor_id = payment.vendorId;
    if (payment.relatedInvoiceId) docData.related_invoice_id = payment.relatedInvoiceId;
    if (payment.refundOfPaymentId) docData.refund_of_payment_id = payment.refundOfPaymentId;
    if (payment.category) docData.category = payment.category;
    if (payment.notes) docData.notes = payment.notes;
    if (payment.receiptNo) docData.receipt_no = payment.receiptNo;
    if (payment.fromAccountId) docData.from_account_id = payment.fromAccountId;
    if (payment.toAccountId) docData.to_account_id = payment.toAccountId;
    if (payment.archivedAt) docData.archived_at = Timestamp.fromDate(payment.archivedAt);

    const docRef = await this.collection.add(docData);
    payment.id = docRef.id;
    return payment;
  }

  async findById(id: string, orgId: string): Promise<Payment | null> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return null;

    const data = doc.data() as PaymentDocument;
    if (data.org_id !== orgId) return null;

    return new Payment(
      id,
      data.org_id,
      data.payment_type,
      data.amount,
      data.currency,
      data.payment_mode,
      data.created_by,
      data.updated_by,
      data.is_deleted,
      data.created_at.toDate(),
      data.updated_at.toDate(),
      data.booking_id,
      data.customer_id,
      data.vendor_id,
      data.related_invoice_id,
      data.refund_of_payment_id,
      data.category,
      data.notes,
      data.receipt_no,
      data.from_account_id,
      data.to_account_id,
      data.archived_at?.toDate()
    );
  }

  async findByBookingId(bookingId: string, orgId: string): Promise<Payment[]> {
    const snapshot = await this.collection
      .where('org_id', '==', orgId)
      .where('booking_id', '==', bookingId)
      .where('is_deleted', '==', false)
      .get();
    
    return snapshot.docs.map(doc => {
      const data = doc.data() as PaymentDocument;
      return new Payment(
        doc.id,
        data.org_id,
        data.payment_type,
        data.amount,
        data.currency,
        data.payment_mode,
        data.created_by,
        data.updated_by,
        data.is_deleted,
        data.created_at.toDate(),
        data.updated_at.toDate(),
        data.booking_id,
        data.customer_id,
        data.vendor_id,
        data.related_invoice_id,
        data.refund_of_payment_id,
        data.category,
        data.notes,
        data.receipt_no,
        data.from_account_id,
        data.to_account_id,
        data.archived_at?.toDate()
      );
    });
  }

  async findByCustomerId(customerId: string, orgId: string): Promise<Payment[]> {
    const snapshot = await this.collection
      .where('org_id', '==', orgId)
      .where('customer_id', '==', customerId)
      .where('is_deleted', '==', false)
      .get();
    
    return snapshot.docs.map(doc => {
      const data = doc.data() as PaymentDocument;
      return new Payment(
        doc.id,
        data.org_id,
        data.payment_type,
        data.amount,
        data.currency,
        data.payment_mode,
        data.created_by,
        data.updated_by,
        data.is_deleted,
        data.created_at.toDate(),
        data.updated_at.toDate(),
        data.booking_id,
        data.customer_id,
        data.vendor_id,
        data.related_invoice_id,
        data.refund_of_payment_id,
        data.category,
        data.notes,
        data.receipt_no,
        data.from_account_id,
        data.to_account_id,
        data.archived_at?.toDate()
      );
    });
  }

  async findByVendorId(vendorId: string, orgId: string): Promise<Payment[]> {
    const snapshot = await this.collection
      .where('org_id', '==', orgId)
      .where('vendor_id', '==', vendorId)
      .where('is_deleted', '==', false)
      .get();
    
    return snapshot.docs.map(doc => {
      const data = doc.data() as PaymentDocument;
      return new Payment(
        doc.id,
        data.org_id,
        data.payment_type,
        data.amount,
        data.currency,
        data.payment_mode,
        data.created_by,
        data.updated_by,
        data.is_deleted,
        data.created_at.toDate(),
        data.updated_at.toDate(),
        data.booking_id,
        data.customer_id,
        data.vendor_id,
        data.related_invoice_id,
        data.refund_of_payment_id,
        data.category,
        data.notes,
        data.receipt_no,
        data.from_account_id,
        data.to_account_id,
        data.archived_at?.toDate()
      );
    });
  }

  async findByType(paymentType: PaymentType, orgId: string): Promise<Payment[]> {
    const snapshot = await this.collection
      .where('org_id', '==', orgId)
      .where('payment_type', '==', paymentType)
      .where('is_deleted', '==', false)
      .get();
    
    return snapshot.docs.map(doc => {
      const data = doc.data() as PaymentDocument;
      return new Payment(
        doc.id,
        data.org_id,
        data.payment_type,
        data.amount,
        data.currency,
        data.payment_mode,
        data.created_by,
        data.updated_by,
        data.is_deleted,
        data.created_at.toDate(),
        data.updated_at.toDate(),
        data.booking_id,
        data.customer_id,
        data.vendor_id,
        data.related_invoice_id,
        data.refund_of_payment_id,
        data.category,
        data.notes,
        data.receipt_no,
        data.from_account_id,
        data.to_account_id,
        data.archived_at?.toDate()
      );
    });
  }

  async findAll(orgId: string, limit: number = 20, offset: number = 0): Promise<Payment[]> {
    const snapshot = await this.collection
      .where('org_id', '==', orgId)
      .where('is_deleted', '==', false)
      .limit(limit)
      .offset(offset)
      .get();
    
    return snapshot.docs.map(doc => {
      const data = doc.data() as PaymentDocument;
      return new Payment(
        doc.id,
        data.org_id,
        data.payment_type,
        data.amount,
        data.currency,
        data.payment_mode,
        data.created_by,
        data.updated_by,
        data.is_deleted,
        data.created_at.toDate(),
        data.updated_at.toDate(),
        data.booking_id,
        data.customer_id,
        data.vendor_id,
        data.related_invoice_id,
        data.refund_of_payment_id,
        data.category,
        data.notes,
        data.receipt_no,
        data.from_account_id,
        data.to_account_id,
        data.archived_at?.toDate()
      );
    });
  }

  async update(payment: Payment, orgId: string): Promise<Payment> {
    const updateData: any = {
      payment_type: payment.paymentType,
      amount: payment.amount,
      currency: payment.currency,
      payment_mode: payment.paymentMode,
      updated_by: payment.updatedBy,
      is_deleted: payment.isDeleted,
      updated_at: Timestamp.now(),
    };

    if (payment.bookingId) updateData.booking_id = payment.bookingId;
    if (payment.customerId) updateData.customer_id = payment.customerId;
    if (payment.vendorId) updateData.vendor_id = payment.vendorId;
    if (payment.relatedInvoiceId) updateData.related_invoice_id = payment.relatedInvoiceId;
    if (payment.refundOfPaymentId) updateData.refund_of_payment_id = payment.refundOfPaymentId;
    if (payment.category) updateData.category = payment.category;
    if (payment.notes) updateData.notes = payment.notes;
    if (payment.receiptNo) updateData.receipt_no = payment.receiptNo;
    if (payment.fromAccountId) updateData.from_account_id = payment.fromAccountId;
    if (payment.toAccountId) updateData.to_account_id = payment.toAccountId;
    if (payment.archivedAt) updateData.archived_at = Timestamp.fromDate(payment.archivedAt);

    await this.collection.doc(payment.id).set(updateData, { merge: true });
    payment.updatedAt = new Date();
    return payment;
  }

  async delete(id: string, orgId: string): Promise<boolean> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return false;

    const data = doc.data() as PaymentDocument;
    if (data.org_id !== orgId) return false;

    await this.collection.doc(id).update({ is_deleted: true });
    return true;
  }

  async getTotalReceivablesByBooking(bookingId: string, orgId: string): Promise<number> {
    const snapshot = await this.collection
      .where('org_id', '==', orgId)
      .where('booking_id', '==', bookingId)
      .where('payment_type', '==', 'receivable')
      .where('is_deleted', '==', false)
      .get();

    return snapshot.docs.reduce((total, doc) => total + (doc.data() as PaymentDocument).amount, 0);
  }

  async getTotalExpensesByVendor(vendorId: string, orgId: string): Promise<number> {
    const snapshot = await this.collection
      .where('org_id', '==', orgId)
      .where('vendor_id', '==', vendorId)
      .where('payment_type', '==', 'expense')
      .where('is_deleted', '==', false)
      .get();

    return snapshot.docs.reduce((total, doc) => total + (doc.data() as PaymentDocument).amount, 0);
  }

  async getTotalRefundsByBooking(bookingId: string, orgId: string): Promise<{ inbound: number; outbound: number }> {
    const snapshot = await this.collection
      .where('org_id', '==', orgId)
      .where('booking_id', '==', bookingId)
      .where('is_deleted', '==', false)
      .get();

    let inbound = 0;
    let outbound = 0;

    snapshot.docs.forEach(doc => {
      const payment = doc.data() as PaymentDocument;
      if (payment.payment_type === PaymentType.REFUND_INBOUND) {
        inbound += payment.amount;
      } else if (payment.payment_type === PaymentType.REFUND_OUTBOUND) {
        outbound += payment.amount;
      }
    });

    return { inbound, outbound };
  }
}
