export interface ReportUIConfig {
  id: string;
  supportsCustomerFilter?: boolean;
  supportsVendorFilter?: boolean;
  supportsTransactionTypeFilter?: boolean;
  supportsPaymentModeFilter?: boolean;
  supportsServiceTypeFilter?: boolean;
  supportsPendingOnly?: boolean;
  supportsIncludeRefunds?: boolean;
  supportsIncludePaymentDetails?: boolean;
  supportsIncludeZeroBalance?: boolean;
}

const REPORT_UI_CONFIG: ReportUIConfig[] = [
  {
    id: "sales-by-customer-detail",
    supportsCustomerFilter: true,
    supportsTransactionTypeFilter: true,
    supportsServiceTypeFilter: true,
    supportsPendingOnly: true,
    supportsIncludeRefunds: true,
    supportsIncludePaymentDetails: true,
  },
  {
    id: "customer-balance-detail",
    supportsCustomerFilter: true,
    supportsTransactionTypeFilter: true,
    supportsIncludeZeroBalance: true,
  },
  {
    id: "customer-payment-details",
    supportsCustomerFilter: true,
    supportsPaymentModeFilter: true,
    supportsIncludeRefunds: true,
  },
  {
    id: "payment-details-by-customer",
    supportsCustomerFilter: true,
    supportsPaymentModeFilter: true,
    supportsIncludeRefunds: true,
  },
  {
    id: "customer-ledger",
    supportsCustomerFilter: true,
    supportsIncludeZeroBalance: true,
  },
  {
    id: "invoice-credit-note-list-by-date",
    supportsCustomerFilter: true,
    supportsIncludeRefunds: true,
  },
  {
    id: "invoice-list",
    supportsCustomerFilter: true,
    supportsServiceTypeFilter: true,
    supportsPendingOnly: true,
  },
  {
    id: "invoices-by-month",
    supportsCustomerFilter: true,
    supportsServiceTypeFilter: true,
  },
  {
    id: "sales-by-product-service-detail",
    supportsCustomerFilter: true,
    supportsServiceTypeFilter: true,
    supportsIncludeRefunds: true,
  },
  {
    id: "transaction-list-by-customer",
    supportsCustomerFilter: true,
    supportsTransactionTypeFilter: true,
    supportsPendingOnly: true,
    supportsIncludeRefunds: true,
  },
  {
    id: "transaction-list-by-date",
    supportsCustomerFilter: true,
    supportsTransactionTypeFilter: true,
    supportsIncludeRefunds: true,
  },
  {
    id: "payment-splits-by-customer",
    supportsCustomerFilter: true,
    supportsPaymentModeFilter: true,
  },
  {
    id: "vendor-ledger",
    supportsVendorFilter: true,
    supportsPaymentModeFilter: true,
    supportsIncludeZeroBalance: true,
  },
  {
    id: "outstanding-payments",
    supportsCustomerFilter: true,
    supportsPendingOnly: true,
  },
  { id: "monthly-income-expense" },
  { id: "refund-register", supportsPaymentModeFilter: true },
  {
    id: "booking-register",
    supportsCustomerFilter: true,
    supportsServiceTypeFilter: true,
    supportsPendingOnly: true,
  },
  { id: "gst-view", supportsCustomerFilter: true },
];

export const PAYMENT_MODE_OPTIONS = [
  "CASH",
  "CARD",
  "UPI",
  "NETBANKING",
  "BANK_TRANSFER",
  "CHEQUE",
  "WALLET",
  "OTHER",
] as const;

export const TRANSACTION_TYPE_OPTIONS = ["INVOICE", "PAYMENT", "CREDIT_MEMO"] as const;

export const SERVICE_TYPE_OPTIONS = [
  "Air Ticket",
  "Railway Ticket",
  "Bus Ticket",
  "Hotel Booking",
  "Cab Service",
  "Tour Package",
  "Visa Service",
  "Travel Service",
] as const;

export function getReportUIConfig(reportId: string): ReportUIConfig {
  return REPORT_UI_CONFIG.find((item) => item.id === reportId) ?? { id: reportId };
}
