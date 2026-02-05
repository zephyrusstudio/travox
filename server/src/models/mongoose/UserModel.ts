import mongoose, { Schema, Document } from 'mongoose';
import { UserRole } from '../FirestoreTypes';

export interface IUserPreferences {
  timezone?: string;
  locale?: string;
  dateFormat?: string;
  theme?: 'light' | 'dark' | 'auto';
}

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  orgId: string;
  name?: string;
  email?: string;
  phone?: string;
  googleId?: string;
  avatar?: string;
  role: UserRole;
  isActive: boolean;
  preferences: IUserPreferences;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserPreferencesSchema = new Schema<IUserPreferences>(
  {
    timezone: { type: String },
    locale: { type: String },
    dateFormat: { type: String },
    theme: { type: String, enum: ['light', 'dark', 'auto'] },
  },
  { _id: false }
);

const UserSchema = new Schema<IUser>(
  {
    orgId: { type: String, required: true, index: true },
    name: { type: String },
    email: { type: String, index: true },
    phone: { type: String },
    googleId: { type: String, index: true, sparse: true },
    avatar: { type: String },
    role: { 
      type: String, 
      enum: Object.values(UserRole), 
      default: UserRole.ADMIN 
    },
    isActive: { type: Boolean, default: false },
    preferences: { type: UserPreferencesSchema, default: {} },
    lastLoginAt: { type: Date },
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

// Compound indexes
UserSchema.index({ orgId: 1, email: 1 });
UserSchema.index({ orgId: 1, isActive: 1 });

export const UserModel = mongoose.model<IUser>('User', UserSchema);
