import mongoose, { Schema, Document } from 'mongoose';
import { PaymentType, PaymentMode } from '../FirestoreTypes';

export interface IPayment extends Document {
  _id: mongoose.Types.ObjectId;
  orgId: string;
  paymentType: PaymentType;
  amount: number;
  currency: string;
  paymentMode: PaymentMode;
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
  createdBy: string;
  updatedBy: string;
  isDeleted: boolean;
  archivedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    orgId: { type: String, required: true, index: true },
    paymentType: { 
      type: String, 
      enum: Object.values(PaymentType), 
      required: true 
    },
    amount: { type: Number, required: true },
    currency: { type: String, required: true },
    paymentMode: { 
      type: String, 
      enum: Object.values(PaymentMode), 
      required: true 
    },
    bookingId: { type: String, index: true },
    customerId: { type: String, index: true },
    vendorId: { type: String, index: true },
    relatedInvoiceId: { type: String },
    refundOfPaymentId: { type: String },
    category: { type: String },
    notes: { type: String },
    receiptNo: { type: String },
    fromAccountId: { type: String },
    toAccountId: { type: String },
    createdBy: { type: String, required: true },
    updatedBy: { type: String, required: true },
    isDeleted: { type: Boolean, default: false, index: true },
    archivedAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc: Document, ret: Record<string, unknown>) => {
        ret.id = (ret._id as mongoose.Types.ObjectId).toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: (_doc: Document, ret: Record<string, unknown>) => {
        ret.id = (ret._id as mongoose.Types.ObjectId).toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes for common queries
PaymentSchema.index({ orgId: 1, isDeleted: 1 });
PaymentSchema.index({ orgId: 1, bookingId: 1, isDeleted: 1 });
PaymentSchema.index({ orgId: 1, customerId: 1, isDeleted: 1 });
PaymentSchema.index({ orgId: 1, vendorId: 1, isDeleted: 1 });
PaymentSchema.index({ orgId: 1, paymentType: 1, isDeleted: 1 });
PaymentSchema.index({ orgId: 1, createdAt: -1 });

export const PaymentModel = mongoose.model<IPayment>('Payment', PaymentSchema);
