# Reporting Features (Current Support)

This document describes the current reporting capabilities in Travox after the Reporting Center expansion.

## Reporting IA and Routes

Primary reporting entry:

- Reporting Center: `/reports`
- Report runner: `/reports/:reportId`

Preserved legacy-direct report routes (unchanged behavior):

- Customer Report: `/customers/report`
- Vendor Report: `/vendors/report`

## Access and Security

- Reporting endpoints require authenticated access.
- Reporting is organization-scoped by `orgId` from authenticated session.
- Role access is Owner/Admin parity for reporting center and report endpoints.
- Existing owner-only restrictions outside reporting remain unchanged.

## Report Catalog

`GET /reports/catalog` currently lists:

1. Sales by Customer Detail
2. Customer Balance Detail
3. Customer Payment Details
4. Payment Details by Customer
5. Customer Ledger
6. Invoice And Credit Note List by Date
7. Invoice List
8. Invoices by Month
9. Sales by Product/Service Detail
10. Transaction List by Customer
11. Transaction List by Date
12. Transaction List with Splits for Customer Payment Details
13. Vendor Ledger
14. Outstanding Payments
15. Monthly Income vs Expense
16. Refund Register
17. Booking Register
18. GST / Tax View (derived, schema-limited)
19. Customer Report (existing direct route)
20. Vendor Report (existing direct route)

## Report Data Endpoints

New reporting namespace endpoints:

- `GET /reports/sales-by-customer-detail`
- `GET /reports/customer-balance-detail`
- `GET /reports/customer-payment-details`
- `GET /reports/payment-details-by-customer`
- `GET /reports/customer-ledger`
- `GET /reports/invoice-credit-note-list-by-date`
- `GET /reports/invoice-list`
- `GET /reports/invoices-by-month`
- `GET /reports/sales-by-product-service-detail`
- `GET /reports/transaction-list-by-customer`
- `GET /reports/transaction-list-by-date`
- `GET /reports/payment-splits-by-customer`
- `GET /reports/vendor-ledger`
- `GET /reports/outstanding-payments`
- `GET /reports/monthly-income-expense`
- `GET /reports/refund-register`
- `GET /reports/booking-register`
- `GET /reports/gst-view`

Generic route form:

- `GET /reports/:reportId`

Existing endpoints retained:

- `GET /customers/report`
- `GET /vendors/report`

## Shared Filter Contract

Supported query fields for new reports:

- `interval=startISO,endISO`
- `customerIds` (CSV or repeated query)
- `vendorIds` (CSV or repeated query)
- `transactionTypes`
- `paymentModes`
- `serviceTypes`
- `pendingOnly`
- `search`
- `sortBy`
- `sortOrder` (`asc`/`desc`)
- `includeRefunds`
- `includePaymentDetails`
- `includeZeroBalance`
- `bookingId`

## Response Envelope (New Reports)

All `/reports/*` endpoints return:

- `status`
- `data` (rows)
- `count`
- `columns` (key, label, type, align)
- `meta`:
  - `reportId`
  - `title`
  - `generatedAt`
  - `interval`
  - `totals`
  - optional `notes`

## Domain Mapping (Implemented)

Customer-side reporting:

- Invoice-like rows: booking transactions (`Booking`) excluding cancelled/refunded for invoice-style reports.
- Payment rows: receivable payments (`PaymentType.RECEIVABLE`).
- Credit memo rows: outbound refunds (`PaymentType.REFUND_OUTBOUND`).
- Running balance convention:
  - Invoice `+`
  - Payment `-`
  - Credit memo `-`

Vendor-side reporting:

- Expense rows: `PaymentType.EXPENSE`
- Vendor refund rows: `PaymentType.REFUND_INBOUND`
- Running balance convention:
  - Expense `+`
  - Inbound refund `-`

Product/service labels:

- Derived from booking journey mode / package fields with stable fallback labels.

## Truthful Constraints

- Payment split report is truthful to current model: one receivable payment maps to one booking target row.
- Native multi-invoice split allocation is not fabricated.
- GST view is explicitly marked derived; canonical tax split fields are not fabricated where schema is absent.
- Qty/unit price are only shown when safely derivable (e.g., booking pax-based rows).

## Export and Print Support

New report runner supports:

- CSV export
- Excel-compatible XML (`.xls`) export
- Print/PDF output (print window)

Existing Customer/Vendor report exports remain intact.

## Caching and Freshness

- New report namespace uses Redis cache keys under `report:center:<orgId>:...`.
- Existing report cache keys remain:
  - customer report: `report:customers:bookings:*`
  - vendor report: `report:vendors:expenses:*`
- Cache invalidation is wired on booking/payment/refund mutation paths to keep report views fresh.
