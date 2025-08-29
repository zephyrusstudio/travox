export interface Customer {
  customer_id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  passport_number?: string;
  gstin?: string;
  created_at: string;
}

export interface Vendor {
  vendor_id: string;
  vendor_name: string;
  service_type: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  bank_details?: string;
}

export interface Service {
  service_id: string;
  service_name: string;
  service_type: string;
  description?: string;
}

export interface Booking {
  booking_id: string;
  customer_id: string;
  customer_name?: string;
  package_name: string;
  booking_date: string;
  travel_start_date: string;
  travel_end_date: string;
  pax_count: number;
  total_amount: number;
  advance_received: number;
  balance_amount: number;
  status: "confirmed" | "pending" | "cancelled";
}

export interface Payment {
  payment_id: string;
  booking_id: string;
  payment_date: string;
  amount: number;
  payment_mode: "cash" | "upi" | "credit_card" | "bank_transfer";
  receipt_number: string;
  notes?: string;
}

export interface Expense {
  expense_id: string;
  date: string;
  vendor_id?: string;
  vendor_name?: string;
  booking_id?: string;
  category: string;
  amount: number;
  description: string;
  payment_mode: string;
  invoice_number?: string;
  attachment_path?: string;
}

export interface Refund {
  refund_id: string;
  booking_id: string;
  refund_date: string;
  refund_amount: number;
  refund_reason: string;
  refund_mode: string;
}

export interface User {
  user_id: string;
  username: string;
  email: string;
  role: "admin" | "manager" | "accountant";
  password_hash?: string;
}

export interface LogEntry {
  log_id: string;
  user_id: string;
  username?: string;
  action: string;
  target: string;
  timestamp: string;
}

export interface TicketData {
  ticket_id: string;
  file_name: string;
  upload_date: string;
  status: "processing" | "extracted" | "draft" | "finalized" | "error";
  extracted_data?: {
    pax_list: Array<{
      name: string;
      age?: number;
      gender?: string;
      is_primary: boolean;
    }>;
    booking_date: string;
    journey_date: string;
    journey_time: string;
    return_date?: string;
    pnr: string;
    booking_amount: number;
    travel_category: "Domestic" | "International" | "Corporate";
    airline?: string;
    flight_number?: string;
    route?: string;
  };
  manual_data?: {
    customer_id: string;
    customer_name: string;
    package_name: string;
    final_amount: number;
    discount: number;
    advance_received: number;
    receivable_amount: number;
    booking_status: "Generated" | "Under Review" | "Confirmed";
  };
  pdf_url?: string;
  linked_booking_id?: string;
}

export interface DashboardStats {
  totalRevenue: number;
  pendingAmount: number;
  monthlyExpense: number;
  activeBookings: number;
}

export interface ReminderItem {
  id: string;
  type: "booking_start" | "booking_end" | "payment_due";
  title: string;
  date: string;
  amount?: number;
  customer?: string;
}
