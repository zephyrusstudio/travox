export enum PaymentMode {
  CASH = "cash",
  UPI = "upi",
  CREDIT_CARD = "credit_card",
  BANK_TRANSFER = "bank_transfer",
}

export const PAYMENT_MODE_LABEL: Record<PaymentMode, string> = {
  [PaymentMode.CASH]: "Cash",
  [PaymentMode.UPI]: "UPI",
  [PaymentMode.CREDIT_CARD]: "Credit Card",
  [PaymentMode.BANK_TRANSFER]: "Bank Transfer",
};

// Variants used by <Badge /> in existing UI
export type BadgeVariant = "success" | "info" | "warning" | "default";

export const PAYMENT_MODE_BADGE: Record<PaymentMode, BadgeVariant> = {
  [PaymentMode.CASH]: "success",
  [PaymentMode.UPI]: "info",
  [PaymentMode.CREDIT_CARD]: "warning",
  [PaymentMode.BANK_TRANSFER]: "default",
};

export interface Payment {
  payment_id: string;
  booking_id: string;
  payment_date: string; // ISO date string
  amount: number;
  payment_mode: PaymentMode;
  receipt_number: string;
  notes?: string;
}

export interface BookingRef {
  booking_id: string;
  package_name: string;
  customer_name?: string;
  balance_amount: number;
}

export interface PaymentFormState {
  booking_id: string;
  payment_date: string; // ISO date string (yyyy-mm-dd)
  amount: number;
  payment_mode: PaymentMode;
  receipt_number: string;
  notes: string;
}

export const todayISO = (): string => new Date().toISOString().split("T")[0];

export const formatDate = (iso: string): string =>
  new Date(iso).toLocaleDateString("en-IN");
