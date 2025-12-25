/**
 * BookingForm V2 Types
 * These types match the server-side DTOs exactly to ensure payload compatibility
 */

// ─────────────────────────────────────────────────────────────────────────────
// Enums (matching server FirestoreTypes.ts)
// ─────────────────────────────────────────────────────────────────────────────

export enum PAXType {
  ADT = 'ADT',
  CHD = 'CHD', 
  INF = 'INF'
}

export enum Sex {
  MALE = 'Male',
  FEMALE = 'Female',
  TRANSGENDER = 'Transgender'
}

export enum ModeOfJourney {
  FLIGHT = 'FLIGHT',
  TRAIN = 'TRAIN',
  BUS = 'BUS',
  HOTEL = 'HOTEL',
  CAB = 'CAB',
  OTHER = 'OTHER'
}

export enum BookingStatus {
  DRAFT = 'Draft',
  CONFIRMED = 'Confirmed',
  TICKETED = 'Ticketed',
  IN_PROGRESS = 'In Progress',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled',
  REFUNDED = 'Refunded'
}

// ─────────────────────────────────────────────────────────────────────────────
// DTOs matching server CreateBooking.ts
// ─────────────────────────────────────────────────────────────────────────────

export interface PaxDTO {
  paxName: string;
  paxType: PAXType;
  sex?: Sex;
  passportNo?: string;
  dob?: Date | string; // Date for payload, string for form input
}

export interface SegmentDTO {
  seqNo: number;
  modeOfJourney: ModeOfJourney;
  carrierCode?: string;
  serviceNumber?: string;
  depCode?: string;
  arrCode?: string;
  depAt?: Date | string;
  arrAt?: Date | string;
  classCode?: string;
  baggage?: string;
  hotelName?: string;
  hotelAddress?: string;
  checkIn?: Date | string;
  checkOut?: Date | string;
  roomType?: string;
  mealPlan?: string;
  operatorName?: string;
  boardingPoint?: string;
  dropPoint?: string;
  misc?: Record<string, unknown>;
}

export interface ItineraryDTO {
  name: string;
  seqNo: number;
  segments: SegmentDTO[];
}

export interface CreateBookingDTO {
  customerId: string;
  currency: string;
  totalAmount: number;
  pax: PaxDTO[];
  itineraries?: ItineraryDTO[];
  bookingDate?: Date | string;
  packageName?: string;
  pnrNo?: string;
  modeOfJourney?: string;
  status?: BookingStatus;
  vendorId?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Form State Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Form state for Pax - optimized for form inputs (all strings/empty values)
 */
export interface PaxFormState {
  paxName: string;
  paxType: PAXType | '';
  sex: Sex | '';
  passportNo: string;
  dob: string; // YYYY-MM-DD format
}

/**
 * Form state for Segment - optimized for form inputs
 */
export interface SegmentFormState {
  seqNo: number;
  modeOfJourney: ModeOfJourney | '';
  // Flight/Train/Bus fields
  carrierCode: string;
  serviceNumber: string;
  depCode: string;
  arrCode: string;
  depAt: string; // YYYY-MM-DDTHH:mm
  arrAt: string; // YYYY-MM-DDTHH:mm
  classCode: string;
  baggage: string;
  // Hotel fields
  hotelName: string;
  hotelAddress: string;
  checkIn: string; // YYYY-MM-DDTHH:mm
  checkOut: string; // YYYY-MM-DDTHH:mm
  roomType: string;
  mealPlan: string;
  // Bus/Cab fields
  operatorName: string;
  boardingPoint: string;
  dropPoint: string;
  // Misc fields (flexible JSON)
  misc: Record<string, unknown>;
}

/**
 * Form state for Itinerary
 */
export interface ItineraryFormState {
  name: string;
  seqNo: number;
  segments: SegmentFormState[];
}

/**
 * Main booking form state
 */
export interface BookingFormStateV2 {
  customerId: string;
  currency: string;
  totalAmount: number | '';
  bookingDate: string; // YYYY-MM-DD
  packageName: string;
  pnrNo: string;
  modeOfJourney: string;
  status: BookingStatus;
  vendorId: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// OCR/AI Extraction Types
// ─────────────────────────────────────────────────────────────────────────────

// Raw OCR extraction format from server
export interface OCRExtractedData {
  // Basic booking info
  packageName?: string;
  pnrNo?: string;
  bookingDate?: string;
  totalAmount?: number;
  currency?: string;
  modeOfJourney?: string;
  
  // PAX information (note: server uses 'pax' not 'paxList')
  pax?: Array<{
    paxName: string;
    paxType?: PAXType;
    sex?: Sex;
    passportNo?: string;
    dob?: string;
  }>;
  
  // Itinerary info (if extracted)
  itineraries?: ItineraryDTO[];
  
  // Vendor info
  vendorInfo?: {
    name?: string;
    contact?: string;
    email?: string;
  };
  
  // Extraction metadata
  extractionMetadata?: {
    confidence?: string;
    extractedFields?: string[];
    notes?: string;
    schemaVersion?: string;
  };
}

export interface OCRUploadResponse {
  status: 'success' | 'error';
  message: string;
  data?: {
    fileInfo: {
      name: string;
      mimeType: string;
      size: number;
    };
    extractedData?: OCRExtractedData;
    booking?: OCRExtractedData; // When format=true, cleaned booking data is here
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Customer Types
// ─────────────────────────────────────────────────────────────────────────────

export interface CustomerLite {
  customer_id: string;
  full_name: string;
  email?: string;
  phone?: string;
  passportNo?: string;
  gstin?: string;
}

export interface NewCustomerData {
  full_name: string;
  email: string;
  phone: string;
  address: string;
  passportNo: string;
  gstin: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Vendor Types
// ─────────────────────────────────────────────────────────────────────────────

export interface VendorLite {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  serviceType?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Mode-specific validation helpers
// ─────────────────────────────────────────────────────────────────────────────

export const SEGMENT_FIELDS_BY_MODE: Record<
  ModeOfJourney,
  {
    required: Array<keyof SegmentDTO>;
    visible: Array<keyof SegmentDTO>;
  }
> = {
  [ModeOfJourney.FLIGHT]: {
    required: ['depCode'],
    visible: ['carrierCode', 'serviceNumber', 'depCode', 'arrCode', 'depAt', 'arrAt', 'classCode', 'baggage']
  },
  [ModeOfJourney.TRAIN]: {
    required: ['depCode'],
    visible: ['carrierCode', 'serviceNumber', 'depCode', 'arrCode', 'depAt', 'arrAt', 'classCode']
  },
  [ModeOfJourney.BUS]: {
    required: ['boardingPoint'],
    visible: ['operatorName', 'serviceNumber', 'boardingPoint', 'dropPoint', 'depAt', 'arrAt']
  },
  [ModeOfJourney.HOTEL]: {
    required: ['hotelName'],
    visible: ['hotelName', 'hotelAddress', 'checkIn', 'checkOut', 'roomType', 'mealPlan', 'misc']
  },
  [ModeOfJourney.CAB]: {
    required: [],
    visible: ['operatorName', 'boardingPoint', 'dropPoint', 'depAt', 'arrAt']
  },
  [ModeOfJourney.OTHER]: {
    required: [],
    visible: ['operatorName', 'depCode', 'arrCode', 'depAt', 'arrAt', 'misc']
  }
};
