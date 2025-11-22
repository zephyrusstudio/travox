// components/bookings/booking.types.ts

export enum TravelCategory {
  Domestic = "Domestic",
  International = "International",
  Corporate = "Corporate",
}

export enum BookingStatus {
  DRAFT = "Draft",
  CONFIRMED = "Confirmed", 
  TICKETED = "Ticketed",
  IN_PROGRESS = "In Progress",
  COMPLETED = "Completed",
  CANCELLED = "Cancelled",
  REFUNDED = "Refunded",
}

export enum Sex {
  MALE = "Male",
  FEMALE = "Female",
  TRANSGENDER = "Transgender",
}

// Legacy Gender enum kept for backward compatibility
export enum Gender {
  Male = "Male",
  Female = "Female",
}

export enum PaxTypeOption {
  ADT = "ADT",
  CHD = "CHD",
  INF = "INF",
}

export enum ModeOfJourneyOption {
  FLIGHT = "FLIGHT",
  TRAIN = "TRAIN",
  BUS = "BUS",
  HOTEL = "HOTEL",
  CAB = "CAB",
  OTHER = "OTHER",
}

export interface Pax {
  name: string;
  paxType: PaxTypeOption | "";
  sex?: Sex | string;
  passportNo?: string;
  dob?: string;
  age?: number;
  gender?: Gender | string; // Kept for backward compatibility
  isPrimary: boolean;
}

export interface SegmentMiscForm {
  totalRooms: number | "";
  totalGuests: string;
  totalNights: number | "";
}

export interface SegmentForm {
  seqNo: number;
  modeOfJourney: ModeOfJourneyOption | string;
  carrierCode: string;
  serviceNumber: string;
  depCode: string;
  arrCode: string;
  depAt: string;
  arrAt: string;
  classCode: string;
  baggage: string;
  hotelName: string;
  hotelAddress: string;
  checkIn: string;
  checkOut: string;
  roomType: string;
  mealPlan: string;
  operatorName: string;
  boardingPoint: string;
  dropPoint: string;
  misc: SegmentMiscForm;
}

export interface ItineraryForm {
  name: string;
  seqNo: number;
  segments: SegmentForm[];
}

export interface VendorInfoForm {
  name: string;
  contact: string;
  email: string;
}

export interface ExtractionMetadataForm {
  confidence: string;
  extractedFields: string[];
  notes: string;
  schemaVersion: string;
}

export interface ExtractedData {
  paxList: Pax[];
  bookingDate: string; // yyyy-mm-dd
  journeyDate: string; // yyyy-mm-dd
  journeyTime: string; // HH:mm
  returnDate?: string; // yyyy-mm-dd
  pnr: string;
  bookingAmount: number;
  travelCategory: TravelCategory;
  airline?: string;
  flightNumber?: string;
  route?: string;
}

export interface AIDataState {
  pnr: string;
  route: string;
  airline: string;
  flightNumber: string;
  journeyDate: string;
  journeyTime: string;
  returnDate: string;
  bookingAmount: number;
  travelCategory: TravelCategory;
  paxList: Pax[];
  currency: string;
  modeOfJourney: ModeOfJourneyOption | string;
  itineraries: ItineraryForm[];
  vendorInfo: VendorInfoForm;
  extractionMetadata: ExtractionMetadataForm;
}

export interface BookingFormState {
  customer_id: string;
  customer_name: string;
  package_name: string;
  pnr_no: string;
  booking_date: string; // yyyy-mm-dd
  travel_start_date: string; // yyyy-mm-dd
  travel_end_date: string; // yyyy-mm-dd
  pax_count: number;
  total_amount: number;
  advance_received: number;
  currency: string;
  mode_of_journey: ModeOfJourneyOption | string;
  status: string;
}

export interface NewCustomerData {
  full_name: string;
  email: string;
  phone: string;
  address: string;
  passportNo: string;
  gstin: string;
}

export interface CustomerLite {
  customer_id: string;
  full_name: string;
  email?: string;
  phone?: string;
  passportNo?: string;
  gstin?: string;
}

export interface TicketData {
  fileName: string;
  pnr: string;
  extractedData: {
    paxList: Array<Pick<Pax, "name" | "isPrimary">>;
    journeyDate: string;
    returnDate: string;
    bookingAmount: number;
    travelCategory: TravelCategory;
    route: string;
  };
}
