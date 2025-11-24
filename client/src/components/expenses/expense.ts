export enum PaymentMode {
  CASH = "cash",
  UPI = "upi",
  CARD = "card",
  BANK_TRANSFER = "bank_transfer",
  NET_BANKING = "netbanking",
  CHEQUE = "cheque",
  WALLET = "wallet",
  OTHER = "other",
}

export const PAYMENT_MODE_LABEL: Record<PaymentMode, string> = {
  [PaymentMode.CASH]: "Cash",
  [PaymentMode.UPI]: "UPI",
  [PaymentMode.CARD]: "Card",
  [PaymentMode.BANK_TRANSFER]: "Bank Transfer",
  [PaymentMode.NET_BANKING]: "Net Banking",
  [PaymentMode.CHEQUE]: "Cheque",
  [PaymentMode.WALLET]: "Wallet",
  [PaymentMode.OTHER]: "Other",
};

// Variants used by <Badge /> in existing UI
export type BadgeVariant = "success" | "info" | "warning" | "default";

export const PAYMENT_MODE_BADGE: Record<PaymentMode, BadgeVariant> = {
  [PaymentMode.CASH]: "success",
  [PaymentMode.UPI]: "info",
  [PaymentMode.CARD]: "warning",
  [PaymentMode.BANK_TRANSFER]: "default",
  [PaymentMode.NET_BANKING]: "info",
  [PaymentMode.CHEQUE]: "default",
  [PaymentMode.WALLET]: "info",
  [PaymentMode.OTHER]: "default",
};

export interface VendorOption {
  vendor_id: string;
  vendor_name: string;
  service_type?: string;
  account_id?: string;
}

export interface AccountOption {
  id: string;
  label: string;
}

export const ACCOUNT_OPTION_PLACEHOLDER_LABEL =
  "Select internal account (optional)";

export interface Expense {
  expense_id: string;
  vendor_id?: string;
  vendor_name?: string;
  amount: number;
  currency?: string;
  payment_mode: PaymentMode;
  category?: string;
  receipt_number?: string;
  notes?: string;
  created_at: string; // ISO date string
}

export interface ExpenseFormState {
  vendor_id: string;
  vendor_account_id: string;
  amount: number;
  currency: string;
  payment_mode: PaymentMode;
  receipt_number: string;
  category: string;
  notes: string;
  from_account_id: string;
}

export const formatDate = (iso: string): string => {
  const date = new Date(iso);
  return date.toLocaleDateString("en-IN", {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
};

const BACKEND_MODE_BY_FRONTEND: Record<PaymentMode, string> = {
  [PaymentMode.CASH]: "CASH",
  [PaymentMode.UPI]: "UPI",
  [PaymentMode.CARD]: "CARD",
  [PaymentMode.BANK_TRANSFER]: "BANK_TRANSFER",
  [PaymentMode.NET_BANKING]: "NETBANKING",
  [PaymentMode.CHEQUE]: "CHEQUE",
  [PaymentMode.WALLET]: "WALLET",
  [PaymentMode.OTHER]: "OTHER",
};

const FRONTEND_MODE_BY_BACKEND: Record<string, PaymentMode> = {
  CASH: PaymentMode.CASH,
  UPI: PaymentMode.UPI,
  CARD: PaymentMode.CARD,
  CREDIT_CARD: PaymentMode.CARD,
  BANK_TRANSFER: PaymentMode.BANK_TRANSFER,
  BANKTRANSFER: PaymentMode.BANK_TRANSFER,
  NETBANKING: PaymentMode.NET_BANKING,
  NET_BANKING: PaymentMode.NET_BANKING,
  CHEQUE: PaymentMode.CHEQUE,
  WALLET: PaymentMode.WALLET,
  OTHER: PaymentMode.OTHER,
};

export const toBackendPaymentMode = (mode: PaymentMode): string =>
  BACKEND_MODE_BY_FRONTEND[mode] ?? BACKEND_MODE_BY_FRONTEND[PaymentMode.CASH];

export const fromBackendPaymentMode = (mode?: string | null): PaymentMode => {
  if (!mode) return PaymentMode.CASH;
  const normalized = mode.toUpperCase();
  return FRONTEND_MODE_BY_BACKEND[normalized] ?? PaymentMode.CASH;
};
