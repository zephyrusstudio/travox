import mongoose, { Schema, Document } from 'mongoose';

export interface ICustomer extends Document {
  _id: mongoose.Types.ObjectId;
  orgId: string;
  name: string;
  phone?: string;
  email?: string;
  passportNo?: string;
  aadhaarNo?: string;
  visaNo?: string;
  gstin?: string;
  accountId?: string;
  totalBookings: number;
  totalSpent: number;
  createdBy: string;
  updatedBy: string;
  isDeleted: boolean;
  archivedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema = new Schema<ICustomer>(
  {
    orgId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    phone: { type: String },
    email: { type: String },
    passportNo: { type: String },
    aadhaarNo: { type: String },
    visaNo: { type: String },
    gstin: { type: String },
    accountId: { type: String },
    totalBookings: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
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
CustomerSchema.index({ orgId: 1, isDeleted: 1 });
CustomerSchema.index({ orgId: 1, email: 1 });
CustomerSchema.index({ orgId: 1, phone: 1 });
CustomerSchema.index({ orgId: 1, passportNo: 1 });
CustomerSchema.index({ orgId: 1, accountId: 1 });
CustomerSchema.index({ orgId: 1, updatedAt: -1 });

// Text index for search
CustomerSchema.index({ name: 'text', email: 'text', phone: 'text' });

export const CustomerModel = mongoose.model<ICustomer>('Customer', CustomerSchema);
