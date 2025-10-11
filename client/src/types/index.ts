export interface Customer {
  id: string;
  orgId: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  passportNo?: string;
  aadhaarNo?: string;
  visaNo?: string;
  gstin?: string;
  accountId?: string;
  totalBookings?: number;
  createdBy?: string;
  updatedBy?: string;
  isDeleted?: boolean;
  createdAt: string; // ISO string
  updatedAt?: string; // ISO string
}

export type CustomerTableProps = {
  customers: Customer[];
  onEdit: (c: Customer) => void;
  onDelete: (id: string) => void;
  onViewTickets: (c: Customer) => void;
  onManageAccount: (c: Customer) => void;
  getBookingsByCustomer: (id: string) => Booking[];
};

export interface Vendor {
  id: string;
  name: string;
  serviceType: string;
  pocName?: string;
  email?: string;
  phone?: string;
  gstin?: string;
  accountId?: string;
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
  payment_mode:
    | "cash"
    | "upi"
    | "card"
    | "credit_card"
    | "bank_transfer"
    | "netbanking"
    | "cheque"
    | "wallet"
    | "other";
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

export interface AuditLog {
  id: string;
  orgId: string;
  actorId: string;
  entity: string;
  entityId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW';
  diff: {
    before?: Record<string, unknown> | string | null;
    after?: Record<string, unknown> | string | null;
    accessed?: boolean;
  };
  ip: string;
  userAgent: string;
  createdAt: string; // Will be converted from Firestore timestamp
  // Additional computed fields for UI
  actorName?: string;
  timestamp?: string; // Alias for createdAt for backward compatibility
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
