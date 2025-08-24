// Firestore collection types and interfaces for TMS database schema

import { Timestamp } from 'firebase-admin/firestore';

// Base interface for all documents with org_id for multi-tenancy
export interface BaseDocument {
  id?: string;
  org_id: string;
  created_at: Timestamp;
  updated_at: Timestamp;
}

// Enums based on your schema
export enum UserRole {
  OWNER = 'Owner',
  ADMIN = 'Admin',
  OPS = 'Ops',
  FINANCE = 'Finance',
  AGENT = 'Agent',
  VIEWER = 'Viewer'
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
  ADT = 'ADT', // Adult
  CHD = 'CHD', // Child
  INF = 'INF'  // Infant
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

// Organizations
export interface OrganizationDocument extends BaseDocument {
  name: string;
}

// Users (extending your existing User domain model)
export interface UserDocument extends BaseDocument {
  email: string;
  name: string;
  role: UserRole;
  is_active: boolean;
  timezone: string;
  phone?: string;
  roles?: string[]; // For backward compatibility with existing code
}

// Auth Identities
export interface AuthIdentityDocument extends BaseDocument {
  user_id: string;
  provider: string;
  provider_sub: string;
}

// Auth Tokens
export interface AuthTokenDocument extends BaseDocument {
  user_id: string;
  token_hash: string;
  expires_at: Timestamp;
  revoked_at?: Timestamp;
}

// Audit Logs
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
  created_at: Timestamp;
}

// Accounts
export interface AccountDocument extends BaseDocument {
  bank_name?: string;
  ifsc_code?: string;
  branch_name?: string;
  account_no?: string; // Sensitive
  upi_id?: string;
  is_active: boolean;
  created_by: string;
  updated_by: string;
  archived_at?: Timestamp;
}

// Customers
export interface CustomerDocument extends BaseDocument {
  name: string;
  phone?: string;
  email?: string;
  passport_no?: string; // Sensitive
  aadhaar_no?: string;  // Sensitive
  visa_no?: string;
  gstin?: string;
  account_id?: string;
  total_bookings?: number;
  created_by: string;
  updated_by: string;
  is_deleted: boolean;
  archived_at?: Timestamp;
}

// Vendors
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
  archived_at?: Timestamp;
}

// Bookings
export interface BookingDocument extends BaseDocument {
  customer_id: string;
  package_name?: string;
  booking_date: Timestamp;
  pax_count: number;
  primary_pax_name?: string;
  pnr_no?: string;
  mode_of_journey?: string;
  currency: string;
  travel_start_at?: Timestamp;
  travel_end_at?: Timestamp;
  total_amount: number;
  paid_amount: number;
  due_amount: number;
  advance_amount?: number;
  status: BookingStatus;
  created_by: string;
  updated_by: string;
  is_deleted: boolean;
  archived_at?: Timestamp;
}

// Booking PAX
export interface BookingPAXDocument extends BaseDocument {
  booking_id: string;
  pax_name: string;
  pax_type: PAXType;
  passport_no?: string; // Sensitive
  dob?: Timestamp;
}

// Booking Itineraries
export interface BookingItineraryDocument extends BaseDocument {
  booking_id: string;
  name: string;
  seq_no: number;
}

// Booking Segments
export interface BookingSegmentDocument extends BaseDocument {
  itinerary_id: string;
  seq_no: number;
  mode_of_journey: ModeOfJourney;
  carrier_code?: string;
  number?: string;
  dep_code?: string;
  arr_code?: string;
  dep_at?: Timestamp;
  arr_at?: Timestamp;
  class_code?: string;
  baggage?: string;
  hotel_name?: string;
  hotel_address?: string;
  check_in?: Timestamp;
  check_out?: Timestamp;
  room_type?: string;
  meal_plan?: string;
  operator_name?: string;
  boarding_point?: string;
  drop_point?: string;
  misc?: Record<string, any>;
}

// Files
export interface FileDocument extends BaseDocument {
  booking_id?: string;
  customer_id?: string;
  vendor_id?: string;
  kind: FileKind;
  path: string;
  uploaded_by: string;
  uploaded_at: Timestamp;
  is_deleted: boolean;
}

// OCR Jobs
export interface OCRJobDocument extends BaseDocument {
  file_id: string;
  booking_id?: string;
  status: OCRStatus;
  engine?: string;
  extracted_json?: Record<string, any>;
}

// Invoices
export interface InvoiceDocument extends BaseDocument {
  booking_id?: string;
  customer_id?: string;
  vendor_id?: string;
  invoice_no: string;
  invoice_date: Timestamp;
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

// Invoice Items
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

// Payments
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
  archived_at?: Timestamp;
}
