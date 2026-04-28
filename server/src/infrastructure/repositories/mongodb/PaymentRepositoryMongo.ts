import { injectable } from 'tsyringe';
import { IPaymentRepository } from '../../../application/repositories/IPaymentRepository';
import { Payment } from '../../../domain/Payment';
import { PaymentModel } from '../../../models/mongoose/PaymentModel';
import { PaymentType } from '../../../models/FirestoreTypes';

@injectable()
export class PaymentRepositoryMongo implements IPaymentRepository {

  private toDomain(doc: any): Payment {
    return new Payment(
      doc._id.toString(),
      doc.orgId,
      doc.paymentType,
      doc.amount,
      doc.currency,
      doc.paymentMode,
      doc.createdBy,
      doc.updatedBy,
      doc.isDeleted,
      doc.createdAt,
      doc.updatedAt,
      doc.bookingId,
      doc.customerId,
      doc.vendorId,
      doc.relatedInvoiceId,
      doc.refundOfPaymentId,
      doc.category,
      doc.notes,
      doc.receiptNo,
      doc.fromAccountId,
      doc.toAccountId,
      doc.archivedAt
    );
  }

  async create(payment: Payment, orgId: string): Promise<Payment> {
    const doc = new PaymentModel({
      orgId,
      paymentType: payment.paymentType,
      amount: payment.amount,
      currency: payment.currency,
      paymentMode: payment.paymentMode,
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
      createdBy: payment.createdBy,
      updatedBy: payment.updatedBy,
      isDeleted: payment.isDeleted,
      archivedAt: payment.archivedAt,
    });

    const saved = await doc.save();
    payment.id = saved._id.toString();
    return payment;
  }

  async findById(id: string, orgId: string): Promise<Payment | null> {
    const doc = await PaymentModel.findOne({ _id: id, orgId, isDeleted: false });
    if (!doc) return null;
    return this.toDomain(doc);
  }

  async findByBookingId(bookingId: string, orgId: string): Promise<Payment[]> {
    const docs = await PaymentModel.find({ 
      orgId, 
      bookingId, 
      isDeleted: false 
    }).sort({ createdAt: -1 });
    return docs.map(doc => this.toDomain(doc));
  }

  async findByBookingIds(
    bookingIds: string[],
    orgId: string,
    paymentTypes?: PaymentType[]
  ): Promise<Payment[]> {
    if (!bookingIds.length) return [];

    const filter: any = {
      orgId,
      bookingId: { $in: bookingIds },
      isDeleted: false
    };

    if (paymentTypes?.length) {
      filter.paymentType = { $in: paymentTypes };
    }

    const docs = await PaymentModel.find(filter).sort({ createdAt: -1 });
    return docs.map(doc => this.toDomain(doc));
  }

  async findByCustomerId(customerId: string, orgId: string): Promise<Payment[]> {
    const docs = await PaymentModel.find({ 
      orgId, 
      customerId, 
      isDeleted: false 
    }).sort({ createdAt: -1 });
    return docs.map(doc => this.toDomain(doc));
  }

  async findByVendorId(vendorId: string, orgId: string): Promise<Payment[]> {
    const docs = await PaymentModel.find({ 
      orgId, 
      vendorId, 
      isDeleted: false 
    }).sort({ createdAt: -1 });
    return docs.map(doc => this.toDomain(doc));
  }

  async findRefundsByOriginalPaymentId(
    refundOfPaymentId: string,
    orgId: string,
    refundType?: PaymentType
  ): Promise<Payment[]> {
    const filter: any = {
      orgId,
      refundOfPaymentId,
      isDeleted: false
    };

    if (refundType) {
      filter.paymentType = refundType;
    } else {
      filter.paymentType = { $in: [PaymentType.REFUND_INBOUND, PaymentType.REFUND_OUTBOUND] };
    }

    const docs = await PaymentModel.find(filter).sort({ createdAt: -1 });
    return docs.map(doc => this.toDomain(doc));
  }

  async findByType(paymentType: PaymentType, orgId: string): Promise<Payment[]> {
    const docs = await PaymentModel.find({ 
      orgId, 
      paymentType, 
      isDeleted: false 
    }).sort({ createdAt: -1 });
    return docs.map(doc => this.toDomain(doc));
  }

  async findAll(orgId: string, limit: number = 20, offset: number = 0, paymentType?: PaymentType): Promise<Payment[]> {
    const filter: any = { orgId, isDeleted: false };
    if (paymentType) {
      filter.paymentType = paymentType;
    }

    const docs = await PaymentModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit);
    return docs.map(doc => this.toDomain(doc));
  }

  async countAll(orgId: string, paymentType?: PaymentType): Promise<number> {
    const filter: any = { orgId, isDeleted: false };
    if (paymentType) {
      filter.paymentType = paymentType;
    }
    return await PaymentModel.countDocuments(filter);
  }

  async update(payment: Payment, orgId: string): Promise<Payment> {
    const updateData = {
      paymentType: payment.paymentType,
      amount: payment.amount,
      currency: payment.currency,
      paymentMode: payment.paymentMode,
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
      updatedBy: payment.updatedBy,
      isDeleted: payment.isDeleted,
      archivedAt: payment.archivedAt,
    };

    await PaymentModel.findOneAndUpdate(
      { _id: payment.id, orgId },
      updateData,
      { new: true }
    );

    payment.updatedAt = new Date();
    return payment;
  }

  async delete(id: string, orgId: string): Promise<boolean> {
    const result = await PaymentModel.findOneAndDelete({ _id: id, orgId });
    return result !== null;
  }

  async getTotalReceivablesByBooking(bookingId: string, orgId: string): Promise<number> {
    const result = await PaymentModel.aggregate([
      { 
        $match: { 
          orgId, 
          bookingId, 
          paymentType: PaymentType.RECEIVABLE, 
          isDeleted: false 
        } 
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    return result[0]?.total || 0;
  }

  async getTotalExpensesByVendor(vendorId: string, orgId: string): Promise<number> {
    const result = await PaymentModel.aggregate([
      { 
        $match: { 
          orgId, 
          vendorId, 
          paymentType: PaymentType.EXPENSE, 
          isDeleted: false 
        } 
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    return result[0]?.total || 0;
  }

  async getTotalRefundsByBooking(bookingId: string, orgId: string): Promise<{ inbound: number; outbound: number }> {
    const inboundResult = await PaymentModel.aggregate([
      { 
        $match: { 
          orgId, 
          bookingId, 
          paymentType: PaymentType.REFUND_INBOUND, 
          isDeleted: false 
        } 
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const outboundResult = await PaymentModel.aggregate([
      { 
        $match: { 
          orgId, 
          bookingId, 
          paymentType: PaymentType.REFUND_OUTBOUND, 
          isDeleted: false 
        } 
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    return {
      inbound: inboundResult[0]?.total || 0,
      outbound: outboundResult[0]?.total || 0
    };
  }

  /**
   * No-op for base MongoDB repository (only cached repo needs this)
   */
  async invalidateCacheForPayment(paymentId: string, orgId: string): Promise<void> {
    // No-op: Base repository doesn't use cache
  }

  async invalidateCacheForBookingPayments(bookingId: string, orgId: string): Promise<void> {
    // No-op: Base repository doesn't use cache
  }
}
