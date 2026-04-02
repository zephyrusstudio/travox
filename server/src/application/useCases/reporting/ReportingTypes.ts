import { PaymentMode, PaymentType } from '../../../models/FirestoreTypes';

export const SUPPORTED_REPORT_IDS = [
  'sales-by-customer-detail',
  'customer-balance-detail',
  'customer-payment-details',
  'payment-details-by-customer',
  'customer-ledger',
  'invoice-credit-note-list-by-date',
  'invoice-list',
  'invoices-by-month',
  'sales-by-product-service-detail',
  'transaction-list-by-customer',
  'transaction-list-by-date',
  'payment-splits-by-customer',
  'vendor-ledger',
  'outstanding-payments',
  'monthly-income-expense',
  'refund-register',
  'booking-register',
  'gst-view',
] as const;

export type ReportId = typeof SUPPORTED_REPORT_IDS[number];

export type ReportCategory =
  | 'Sales'
  | 'Customers'
  | 'Vendors'
  | 'Transactions'
  | 'Refunds'
  | 'Existing';

export interface ReportCatalogItem {
  id: string;
  label: string;
  description: string;
  category: ReportCategory;
  route: string;
  endpoint?: string;
  existing?: boolean;
  experimental?: boolean;
}

export type SortOrder = 'asc' | 'desc';

export interface ReportQueryFilters {
  startDate: Date;
  endDate: Date;
  customerIds: string[];
  vendorIds: string[];
  transactionTypes: string[];
  paymentModes: PaymentMode[];
  serviceTypes: string[];
  pendingOnly: boolean;
  search: string;
  sortBy: string;
  sortOrder: SortOrder;
  includeRefunds: boolean;
  includePaymentDetails: boolean;
  includeZeroBalance: boolean;
  bookingId: string;
}

export type ReportColumnType = 'text' | 'date' | 'currency' | 'number' | 'badge';

export interface ReportColumn {
  key: string;
  label: string;
  type: ReportColumnType;
  align?: 'left' | 'right' | 'center';
}

export type ReportCell = string | number | boolean | null;
export type ReportRow = Record<string, ReportCell>;

export interface ReportMeta {
  reportId: string;
  title: string;
  generatedAt: string;
  interval: {
    start: string;
    end: string;
  };
  totals: Record<string, number>;
  notes?: string[];
}

export interface ReportResult {
  columns: ReportColumn[];
  rows: ReportRow[];
  meta: ReportMeta;
}

export interface ReportResponseEnvelope {
  status: 'success';
  data: ReportRow[];
  count: number;
  columns: ReportColumn[];
  meta: ReportMeta;
}

export interface CustomerTimelineEvent {
  id: string;
  sourceId: string;
  sourceType: 'BOOKING' | 'RECEIVABLE' | 'REFUND_OUTBOUND';
  customerId: string;
  customerName: string;
  date: Date;
  createdAt: Date;
  transactionType: 'Invoice' | 'Payment' | 'Credit Memo';
  transactionCode: 'INVOICE' | 'PAYMENT' | 'CREDIT_MEMO';
  refNo: string;
  bookingId?: string;
  bookingRef?: string;
  productService: string;
  memo: string;
  qty?: number;
  unitPrice?: number;
  amount: number;
  signedAmount: number;
  paymentMode?: PaymentMode;
  paymentType?: PaymentType;
  notes?: string;
}

export interface VendorTimelineEvent {
  id: string;
  sourceId: string;
  sourceType: 'EXPENSE' | 'REFUND_INBOUND';
  vendorId: string;
  vendorName: string;
  date: Date;
  createdAt: Date;
  transactionType: 'Expense' | 'Vendor Refund';
  transactionCode: 'EXPENSE' | 'REFUND_INBOUND';
  refNo: string;
  bookingId?: string;
  amount: number;
  signedAmount: number;
  paymentMode?: PaymentMode;
  notes?: string;
}
