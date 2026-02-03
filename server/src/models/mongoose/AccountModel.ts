import mongoose, { Schema, Document } from 'mongoose';

export interface IAccount extends Document {
  _id: mongoose.Types.ObjectId;
  orgId: string;
  bankName?: string;
  ifscCode?: string;
  branchName?: string;
  accountNo?: string;
  upiId?: string;
  isActive: boolean;
  createdBy: string;
  updatedBy: string;
  archivedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AccountSchema = new Schema<IAccount>(
  {
    orgId: { type: String, required: true, index: true },
    bankName: { type: String },
    ifscCode: { type: String },
    branchName: { type: String },
    accountNo: { type: String },
    upiId: { type: String },
    isActive: { type: Boolean, default: true },
    createdBy: { type: String, required: true },
    updatedBy: { type: String, required: true },
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

// Indexes
AccountSchema.index({ orgId: 1, archivedAt: 1 });

export const AccountModel = mongoose.model<IAccount>('Account', AccountSchema);
