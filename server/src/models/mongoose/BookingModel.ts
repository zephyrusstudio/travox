import mongoose, { Schema, Document } from 'mongoose';
import { BookingStatus, PAXType, Sex, ModeOfJourney } from '../FirestoreTypes';

// Sub-document interfaces
export interface IBookingSegment {
  id: string;
  orgId: string;
  itineraryId: string;
  seqNo: number;
  modeOfJourney: ModeOfJourney;
  carrierCode?: string;
  serviceNumber?: string;
  depCode?: string;
  arrCode?: string;
  depAt?: Date;
  arrAt?: Date;
  classCode?: string;
  baggage?: string;
  hotelName?: string;
  hotelAddress?: string;
  checkIn?: Date;
  checkOut?: Date;
  roomType?: string;
  mealPlan?: string;
  operatorName?: string;
  boardingPoint?: string;
  dropPoint?: string;
  misc?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBookingItinerary {
  id: string;
  orgId: string;
  bookingId: string;
  name: string;
  seqNo: number;
  segments: IBookingSegment[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IBookingPax {
  id: string;
  orgId: string;
  bookingId: string;
  paxName: string;
  paxType: PAXType;
  sex?: Sex;
  passportNo?: string;
  dob?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBooking extends Document {
  _id: mongoose.Types.ObjectId;
  orgId: string;
  customerId: string;
  bookingDate: Date;
  currency: string;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  pax: IBookingPax[];
  itineraries: IBookingItinerary[];
  paxCount: number;
  primaryPaxName?: string;
  travelStartAt?: Date;
  travelEndAt?: Date;
  packageName?: string;
  pnrNo?: string;
  modeOfJourney?: string;
  advanceAmount?: number;
  status: BookingStatus;
  vendorId?: string;
  ticketId?: string;
  createdBy: string;
  updatedBy: string;
  isDeleted: boolean;
  archivedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Sub-document schemas
const BookingSegmentSchema = new Schema<IBookingSegment>(
  {
    id: { type: String, required: true },
    orgId: { type: String, required: true },
    itineraryId: { type: String, required: true },
    seqNo: { type: Number, required: true },
    modeOfJourney: { 
      type: String, 
      enum: Object.values(ModeOfJourney), 
      required: true 
    },
    carrierCode: { type: String },
    serviceNumber: { type: String },
    depCode: { type: String },
    arrCode: { type: String },
    depAt: { type: Date },
    arrAt: { type: Date },
    classCode: { type: String },
    baggage: { type: String },
    hotelName: { type: String },
    hotelAddress: { type: String },
    checkIn: { type: Date },
    checkOut: { type: Date },
    roomType: { type: String },
    mealPlan: { type: String },
    operatorName: { type: String },
    boardingPoint: { type: String },
    dropPoint: { type: String },
    misc: { type: Schema.Types.Mixed },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const BookingItinerarySchema = new Schema<IBookingItinerary>(
  {
    id: { type: String, required: true },
    orgId: { type: String, required: true },
    bookingId: { type: String, required: true },
    name: { type: String, required: true },
    seqNo: { type: Number, required: true },
    segments: { type: [BookingSegmentSchema], default: [] },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const BookingPaxSchema = new Schema<IBookingPax>(
  {
    id: { type: String, required: true },
    orgId: { type: String, required: true },
    bookingId: { type: String, required: true },
    paxName: { type: String, required: true },
    paxType: { 
      type: String, 
      enum: Object.values(PAXType), 
      required: true 
    },
    sex: { type: String, enum: Object.values(Sex) },
    passportNo: { type: String },
    dob: { type: Date },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

// Main Booking schema
const BookingSchema = new Schema<IBooking>(
  {
    orgId: { type: String, required: true, index: true },
    customerId: { type: String, required: true, index: true },
    bookingDate: { type: Date, required: true },
    currency: { type: String, required: true },
    totalAmount: { type: Number, required: true },
    paidAmount: { type: Number, default: 0 },
    dueAmount: { type: Number, required: true },
    pax: { type: [BookingPaxSchema], default: [] },
    itineraries: { type: [BookingItinerarySchema], default: [] },
    paxCount: { type: Number, default: 0 },
    primaryPaxName: { type: String },
    travelStartAt: { type: Date },
    travelEndAt: { type: Date },
    packageName: { type: String },
    pnrNo: { type: String, index: true },
    modeOfJourney: { type: String },
    advanceAmount: { type: Number },
    status: { 
      type: String, 
      enum: Object.values(BookingStatus), 
      default: BookingStatus.DRAFT 
    },
    vendorId: { type: String },
    ticketId: { type: String },
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
BookingSchema.index({ orgId: 1, isDeleted: 1 });
BookingSchema.index({ orgId: 1, customerId: 1, isDeleted: 1 });
BookingSchema.index({ orgId: 1, status: 1, isDeleted: 1 });
BookingSchema.index({ orgId: 1, bookingDate: 1, isDeleted: 1 });
BookingSchema.index({ orgId: 1, travelStartAt: 1, isDeleted: 1 });
BookingSchema.index({ orgId: 1, travelEndAt: 1, isDeleted: 1 });
BookingSchema.index({ orgId: 1, createdAt: -1 });
BookingSchema.index({ orgId: 1, pnrNo: 1 });

// Text index for search
BookingSchema.index({ pnrNo: 'text', packageName: 'text', primaryPaxName: 'text' });

export const BookingModel = mongoose.model<IBooking>('Booking', BookingSchema);
