import mongoose, { Schema, Document } from 'mongoose';
import { FileKind } from '../FirestoreTypes';

export interface IFile extends Document {
  _id: mongoose.Types.ObjectId;
  orgId: string;
  name: string;
  mimeType: string;
  size: number;
  kind: FileKind;
  gdriveId: string;
  uploadedBy: string;
  uploadedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const FileSchema = new Schema<IFile>(
  {
    orgId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    kind: { 
      type: String, 
      enum: Object.values(FileKind), 
      required: true 
    },
    gdriveId: { type: String, required: true },
    uploadedBy: { type: String, required: true, index: true },
    uploadedAt: { type: Date, required: true },
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
FileSchema.index({ orgId: 1, kind: 1 });
FileSchema.index({ orgId: 1, uploadedBy: 1 });
FileSchema.index({ orgId: 1, uploadedAt: -1 });

export const FileModel = mongoose.model<IFile>('File', FileSchema);
