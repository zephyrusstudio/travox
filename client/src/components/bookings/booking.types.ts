// components/bookings/booking.types.ts

export enum TravelCategory {
  Domestic = "Domestic",
  International = "International",
  Corporate = "Corporate",
}

export enum BookingStatus {
  Confirmed = "confirmed",
  Pending = "pending",
  Cancelled = "cancelled",
}

export enum Gender {
  Male = "Male",
  Female = "Female",
}

export interface Pax {
  name: string;
  age?: number;
  gender?: Gender | string;
  isPrimary: boolean;
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
}

export interface BookingFormState {
  customer_id: string;
  customer_name: string;
  package_name: string;
  booking_date: string; // yyyy-mm-dd
  travel_start_date: string; // yyyy-mm-dd
  travel_end_date: string; // yyyy-mm-dd
  pax_count: number;
  total_amount: number;
  advance_received: number;
  status: BookingStatus;
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
