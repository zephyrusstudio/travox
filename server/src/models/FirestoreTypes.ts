

// Type definitions for document interfaces
// Used by both domain models and repository implementations

export interface BaseDocument {
  id: string;
  org_id: string;
  created_at: Date;
  updated_at: Date;
}


export enum UserRole {
  OWNER = 'Owner',
  ADMIN = 'Admin'
}

export enum ServiceType {
  AIRLINE = 'Airline',
  HOTEL = 'Hotel',
  RAIL = 'Rail',
  BUS = 'Bus',
  CAB = 'Cab',
  DMC = 'DMC',
  VISA = 'Visa',
  INSURANCE = 'Insurance',
  OTHER = 'Other'
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

export enum PaymentType {
  RECEIVABLE = 'RECEIVABLE',
  EXPENSE = 'EXPENSE',
  REFUND_INBOUND = 'REFUND_INBOUND',
  REFUND_OUTBOUND = 'REFUND_OUTBOUND'
}

export enum PaymentMode {
  CASH = 'CASH',
  CARD = 'CARD',
  UPI = 'UPI',
  NETBANKING = 'NETBANKING',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CHEQUE = 'CHEQUE',
  WALLET = 'WALLET'
}

export enum FileKind {
  TICKET = 'TICKET',
  INVOICE = 'INVOICE',
  VOUCHER = 'VOUCHER',
  PASSPORT = 'PASSPORT',
  VISA = 'VISA',
  OTHER = 'OTHER'
}

export enum OCRStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED'
}


export interface OrganizationDocument {
  id: string;
  name: string;
  created_at: Date;
}


export interface UserDocument extends BaseDocument {
  email: string;
  name: string;
  role: UserRole;
  is_active: boolean;
  timezone: string;
}


export interface AuthIdentityDocument extends BaseDocument {
  user_id: string;
  provider: string;
  provider_sub: string;
}


export interface AuthTokenDocument extends BaseDocument {
  user_id: string;
  token_hash: string;
  expires_at: Date;
  revoked_at?: Date;
}


export interface AuditLogDocument {
  id?: string;
  org_id: string;
  actor_id: string;
  entity: string;
  entity_id: string;
  action: string;
  diff: Record<string, any>;
  ip: string;
  user_agent: string;
  created_at: Date;
}


export interface AccountDocument extends BaseDocument {
  bank_name?: string;
  ifsc_code?: string;
  branch_name?: string;
  account_no?: string; 
  upi_id?: string;
  is_active: boolean;
  created_by: string;
  updated_by: string;
  archived_at?: Date;
}


export interface CustomerDocument extends BaseDocument {
  name: string;
  phone?: string;
  email?: string;
  passport_no?: string; 
  aadhaar_no?: string;  
  visa_no?: string;
  gstin?: string;
  account_id?: string;
  total_bookings?: number;
  total_spent?: number;
  created_by: string;
  updated_by: string;
  is_deleted: boolean;
  archived_at?: Date;
}


export interface VendorDocument extends BaseDocument {
  name: string;
  poc_name?: string;
  phone?: string;
  email?: string;
  service_type: ServiceType;
  gstin?: string;
  account_id?: string;
  total_expense?: number;
  total_bookings?: number;
  created_by: string;
  updated_by: string;
  is_deleted: boolean;
  archived_at?: Date;
}


export interface BookingDocument extends BaseDocument {
  customer_id: string;
  package_name?: string;
  booking_date: Date;
  pax_count: number;
  primary_pax_name?: string;
  pnr_no?: string;
  mode_of_journey?: string;
  currency: string;
  travel_start_at?: Date;
  travel_end_at?: Date;
  total_amount: number;
  paid_amount: number;
  refunded_amount?: number;
  due_amount: number;
  advance_amount?: number;
  status: BookingStatus;
  created_by: string;
  updated_by: string;
  is_deleted: boolean;
  archived_at?: Date;
  ticket_id?: string;
}


export interface BookingPAXDocument extends BaseDocument {
  booking_id: string;
  pax_name: string;
  pax_type: PAXType;
  sex?: Sex;
  passport_no?: string; 
  dob?: Date; 
}


export interface BookingItineraryDocument extends BaseDocument {
  booking_id: string;
  name: string;
  seq_no: number;
}


export interface BookingSegmentDocument extends BaseDocument {
  itinerary_id: string;
  seq_no: number;
  mode_of_journey: ModeOfJourney;
  carrier_code?: string;
  number?: string;
  dep_code?: string;
  arr_code?: string;
  dep_at?: Date;
  arr_at?: Date;
  class_code?: string;
  baggage?: string;
  hotel_name?: string;
  hotel_address?: string;
  check_in?: Date;
  check_out?: Date;
  room_type?: string;
  meal_plan?: string;
  operator_name?: string;
  boarding_point?: string;
  drop_point?: string;
  misc?: Record<string, any>;
}


export interface FileDocument extends BaseDocument {
  name: string;
  mime_type: string;
  size: number;
  kind: FileKind;
  gdrive_id: string;
  uploaded_by: string;
  uploaded_at: Date;
}


export interface OCRJobDocument extends BaseDocument {
  file_id: string;
  booking_id?: string;
  status: OCRStatus;
  engine?: string;
  extracted_json?: Record<string, any>;
}


export interface InvoiceDocument extends BaseDocument {
  booking_id?: string;
  customer_id?: string;
  vendor_id?: string;
  invoice_no: string;
  invoice_date: Date;
  currency: string;
  place_of_supply?: string;
  buyer_gstin?: string;
  seller_gstin?: string;
  taxable_value: number;
  cgst_amount?: number;
  sgst_amount?: number;
  igst_amount?: number;
  total_amount: number;
  linked_file_id?: string;
  created_by: string;
}


export interface InvoiceItemDocument extends BaseDocument {
  invoice_id: string;
  description: string;
  hsn_sac?: string;
  qty: number;
  unit_price: number;
  tax_rate?: number;
  taxable_amount: number;
  cgst_amount?: number;
  sgst_amount?: number;
  igst_amount?: number;
}


export interface PaymentDocument extends BaseDocument {
  booking_id?: string;
  customer_id?: string;
  vendor_id?: string;
  related_invoice_id?: string;
  refund_of_payment_id?: string;
  amount: number;
  currency: string;
  payment_type: PaymentType;
  payment_mode: PaymentMode;
  category?: string;
  notes?: string;
  receipt_no?: string;
  from_account_id?: string;
  to_account_id?: string;
  created_by: string;
  updated_by: string;
  is_deleted: boolean;
  archived_at?: Date;
}
