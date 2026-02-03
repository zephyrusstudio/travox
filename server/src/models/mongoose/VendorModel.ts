import mongoose, { Schema, Document } from 'mongoose';
import { ServiceType } from '../FirestoreTypes';

export interface IVendor extends Document {
  _id: mongoose.Types.ObjectId;
  orgId: string;
  name: string;
  serviceType: ServiceType;
  pocName?: string;
  phone?: string;
  email?: string;
  gstin?: string;
  accountId?: string;
  totalExpense: number;
  totalBookings: number;
  createdBy: string;
  updatedBy: string;
  isDeleted: boolean;
  archivedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const VendorSchema = new Schema<IVendor>(
  {
    orgId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    serviceType: { 
      type: String, 
      enum: Object.values(ServiceType), 
      required: true 
    },
    pocName: { type: String },
    phone: { type: String },
    email: { type: String },
    gstin: { type: String },
    accountId: { type: String },
    totalExpense: { type: Number, default: 0 },
    totalBookings: { type: Number, default: 0 },
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
VendorSchema.index({ orgId: 1, isDeleted: 1 });
VendorSchema.index({ orgId: 1, email: 1 });
VendorSchema.index({ orgId: 1, phone: 1 });
VendorSchema.index({ orgId: 1, serviceType: 1 });
VendorSchema.index({ orgId: 1, name: 1, serviceType: 1 });
VendorSchema.index({ orgId: 1, accountId: 1 });

// Text index for search
VendorSchema.index({ name: 'text', pocName: 'text', email: 'text' });

export const VendorModel = mongoose.model<IVendor>('Vendor', VendorSchema);
