# Travox End-to-End Deep Audit Report

Generated at: 2026-03-28T16:38:20.655Z
Scope: full-stack regression and interaction audit across auth, active modules, reporting center, legacy boundaries, and platform gates.

## 1. Executive Summary

| Suite | Total | Passed | Failed |
|---|---:|---:|---:|
| Deep mutation E2E | 54 | 52 | 2 |
| Deep API contract audit | 50 | 46 | 4 |
| Reporting endpoint matrix | 132 | 130 | 2 |
| Frontend route matrix | 18 | 18 | 0 |
| UI wiring scan | 88 files | 150 button tags | 5 potential no-op candidates |
| UI click sweep (sampled) | 36 routes | 126 sampled clicks | 126 unchanged-click observations |

### Build and Lint Gates

- Client lint: PASS
- Client build: PASS
- Server build: PASS
- Smoke script: PASS

### Manual Targeted Probes (Post-Suite Validation)

- `GET /metrics` without auth: `401` (blocked)
- `GET /metrics` with Owner token: `200`
- `GET /metrics` with Admin token: `403` (blocked)
- `POST /metrics/reset` without auth: `401` (blocked)
- `POST /metrics/reset` with Owner token: `200`
- Smoke script currently checks `GET /metrics/reset` (not `POST`), so its `404` line is a script-method mismatch, not endpoint removal.

## 2. Confirmed Not Working (Actionable Defects)

| # | Severity | Defect | Evidence | Source |
|---:|---|---|---|---|
| 1 | P1 | admin users should be blocked by contract | status=200 | Deep mutation E2E |
| 2 | P1 | file upload | status=400; body={"status":"error","data":{"message":"File creation failed: Google Drive upload failed: invalid_grant"}} | Deep mutation E2E |
| 3 | P1 | admin blocked /users?limit=1&offset=0 | got 200 | Deep API audit |
| 4 | P2 | catalog id runnable customer-report-existing | {"status":"error","data":{"message":"Unsupported report: customer-report-existing"}} | Deep API audit |
| 5 | P2 | catalog id runnable vendor-report-existing | {"status":"error","data":{"message":"Unsupported report: vendor-report-existing"}} | Deep API audit |
| 6 | P1 | owner file upload works | {"status":"error","data":{"message":"File creation failed: Google Drive upload failed: invalid_grant"}} | Deep API audit |
| 7 | P2 | existing report id customer-report-existing should not 404 | status=404 | Reporting matrix |
| 8 | P2 | existing report id vendor-report-existing should not 404 | status=404 | Reporting matrix |

## 3. Working Coverage by Domain

### Auth and Session
- Checks executed: 5
- Passed: 5
- Failed: 0
- Working checks:
  - PASS: health endpoint (status=200)
  - PASS: customers requires auth (status=401)
  - PASS: owner users/me (status=200)
  - PASS: metrics requires auth (status=401)
  - PASS: ocr health endpoint (status=200)

### RBAC and Admin/Owner Access
- Checks executed: 6
- Passed: 5
- Failed: 1
- Working checks:
  - PASS: owner users list (status=200)
  - PASS: owner audit logs (status=200)
  - PASS: admin audit blocked (status=403)
  - PASS: owner metrics (status=200)
  - PASS: last-owner / self deactivation protection (status=400)
- Failing checks:
  - FAIL: admin users should be blocked by contract (status=200)

### Customers
- Checks executed: 11
- Passed: 11
- Failed: 0
- Working checks:
  - PASS: customers requires auth (status=401)
  - PASS: create customer (status=201; body={"status":"success","data":{"id":"69c7ff7a97c4fed5edc5c9b2","orgId":"69b66d3bea5902c3133269d4","name":"E2E Customer e2e-1774714744427","phone":"+918814746179","email":"customer.e2e)
  - PASS: get customer by id (status=200)
  - PASS: update customer (status=200)
  - PASS: customer search (status=200)
  - PASS: customer stats (status=200)
  - PASS: customer account view (status=200)
  - PASS: existing customer report (status=200)
  - PASS: report endpoint sales-by-customer-detail (status=200)
  - PASS: report endpoint customer-balance-detail (status=200)
  - PASS: report endpoint payment-splits-by-customer (status=200)

### Vendors
- Checks executed: 7
- Passed: 7
- Failed: 0
- Working checks:
  - PASS: create vendor (status=201; body={"status":"success","data":{"id":"69c7ff7997c4fed5edc5c99a","orgId":"69b66d3bea5902c3133269d4","name":"E2E Vendor e2e-1774714744427","serviceType":"Airline","phone":"+919914745275")
  - PASS: get vendor by id (status=200)
  - PASS: update vendor (status=200)
  - PASS: vendor stats (status=200)
  - PASS: vendor search (status=200)
  - PASS: vendor account view (status=200)
  - PASS: existing vendor report (status=200)

### Bookings
- Checks executed: 7
- Passed: 7
- Failed: 0
- Working checks:
  - PASS: create booking (status=201; body={"status":"success","data":{"id":"69c7ff7b97c4fed5edc5c9c6","orgId":"69b66d3bea5902c3133269d4","customerId":"69c7ff7a97c4fed5edc5c9b2","bookingDate":"2026-03-28T16:19:07.075","curr)
  - PASS: get booking by id (status=200)
  - PASS: booking update with falsy fields (status=200)
  - PASS: booking status transition (draft->confirmed) (status=200)
  - PASS: booking search (status=200)
  - PASS: booking filter (status=200)
  - PASS: booking stats (status=200)

### Finance (Payments, Expenses, Refunds)
- Checks executed: 8
- Passed: 8
- Failed: 0
- Working checks:
  - PASS: create receivable payment (status=201; body={"status":"success","data":{"id":"69c7ff7c97c4fed5edc5c9e6","orgId":"69b66d3bea5902c3133269d4","paymentType":"RECEIVABLE","amount":400,"currency":"INR","paymentMode":"UPI","created)
  - PASS: overpayment prevention (status=400)
  - PASS: create outbound refund (status=201; body={"status":"success","data":{"id":"69c7ff7c97c4fed5edc5c9f1","orgId":"69b66d3bea5902c3133269d4","paymentType":"REFUND_OUTBOUND","amount":400,"currency":"INR","paymentMode":"UPI","cr)
  - PASS: create expense payment (status=201; body={"status":"success","data":{"id":"69c7ff7d97c4fed5edc5c9fa","orgId":"69b66d3bea5902c3133269d4","paymentType":"EXPENSE","amount":300,"currency":"INR","paymentMode":"UPI","createdBy")
  - PASS: create inbound refund (status=201; body={"status":"success","data":{"id":"69c7ff7d97c4fed5edc5ca02","orgId":"69b66d3bea5902c3133269d4","paymentType":"REFUND_INBOUND","amount":300,"currency":"INR","paymentMode":"UPI","cre)
  - PASS: payments list (status=200)
  - PASS: payments filtered list RECEIVABLE (status=200)
  - PASS: payment by id (status=200)

### Reporting Center Endpoints
- Checks executed: 8
- Passed: 8
- Failed: 0
- Working checks:
  - PASS: existing customer report (status=200)
  - PASS: existing vendor report (status=200)
  - PASS: reporting center catalog (status=200)
  - PASS: report endpoint sales-by-customer-detail (status=200)
  - PASS: report endpoint customer-balance-detail (status=200)
  - PASS: report endpoint invoice-list (status=200)
  - PASS: report endpoint transaction-list-by-date (status=200)
  - PASS: report endpoint payment-splits-by-customer (status=200)

### Audit Logs
- Checks executed: 2
- Passed: 2
- Failed: 0
- Working checks:
  - PASS: audit export csv (status=200; contentType=text/csv; charset=utf-8)
  - PASS: audit by entity (status=200)

### Files and OCR
- Checks executed: 5
- Passed: 4
- Failed: 1
- Working checks:
  - PASS: files list (status=200)
  - PASS: ocr health endpoint (status=200)
  - PASS: ocr schema endpoint (status=200)
  - PASS: ocr invalid fileId handling (status=404)
- Failing checks:
  - FAIL: file upload (status=400; body={"status":"error","data":{"message":"File creation failed: Google Drive upload failed: invalid_grant"}})

## 4. Reporting Center Coverage (Detailed)

- Total reporting checks: 132
- Passing reporting checks: 130
- Failing reporting checks: 2

### Catalog Entries

| Report ID | Label | Route | Existing Adapter | Endpoint Runnable |
|---|---|---|---|---|
| sales-by-customer-detail | Sales by Customer Detail | /reports/sales-by-customer-detail | No | Yes |
| customer-balance-detail | Customer Balance Detail | /reports/customer-balance-detail | No | Yes |
| customer-payment-details | Customer Payment Details | /reports/customer-payment-details | No | Yes |
| payment-details-by-customer | Payment Details by Customer | /reports/payment-details-by-customer | No | Yes |
| customer-ledger | Customer Ledger | /reports/customer-ledger | No | Yes |
| invoice-credit-note-list-by-date | Invoice And Credit Note List by Date | /reports/invoice-credit-note-list-by-date | No | Yes |
| invoice-list | Invoice List | /reports/invoice-list | No | Yes |
| invoices-by-month | Invoices by Month | /reports/invoices-by-month | No | Yes |
| sales-by-product-service-detail | Sales by Product/Service Detail | /reports/sales-by-product-service-detail | No | Yes |
| transaction-list-by-customer | Transaction List by Customer | /reports/transaction-list-by-customer | No | Yes |
| transaction-list-by-date | Transaction List by Date | /reports/transaction-list-by-date | No | Yes |
| payment-splits-by-customer | Transaction List with Splits for Customer Payment Details | /reports/payment-splits-by-customer | No | Yes |
| vendor-ledger | Vendor Ledger | /reports/vendor-ledger | No | Yes |
| outstanding-payments | Outstanding Payments | /reports/outstanding-payments | No | Yes |
| monthly-income-expense | Monthly Income vs Expense | /reports/monthly-income-expense | No | Yes |
| refund-register | Refund Register | /reports/refund-register | No | Yes |
| booking-register | Booking Register | /reports/booking-register | No | Yes |
| gst-view | GST / Tax View (Derived) | /reports/gst-view | No | Yes |
| customer-report-existing | Customer Report | /customers/report | Yes | No (404 unsupported) |
| vendor-report-existing | Vendor Report | /vendors/report | Yes | No (404 unsupported) |

## 5. Navigation and UI Interaction Audit

- Route availability matrix: 18/18 passed (0 hard route failures).
- Sidebar scroll probe: found=true, overflowY=auto, scrollHeight=662, clientHeight=395, moved=true.
- Admin guard UI probe: /logs -> /customers, /users -> /customers.

### Potential No-Op Controls (Static Wiring Scan)

| File | Line | Element |
|---|---:|---|
| /Users/sagnikmitra/Desktop/GitHub/travox/client/src/components/calendar/CalendarView.tsx | 213 | <Button icon={Plus}> |
| /Users/sagnikmitra/Desktop/GitHub/travox/client/src/components/dashboard/DetailedBookingsView.tsx | 79 | <Button icon={Download}> |
| /Users/sagnikmitra/Desktop/GitHub/travox/client/src/components/dashboard/DetailedRevenueView.tsx | 92 | <Button icon={Download}> |
| /Users/sagnikmitra/Desktop/GitHub/travox/client/src/components/dashboard/RecentActivity.tsx | 127 | <button className="text-blue-600 hover:text-blue-700 text-sm font-semibold hover:underline transition-colors duration-200"> |
| /Users/sagnikmitra/Desktop/GitHub/travox/client/src/components/dashboard/ReminderCalendar.tsx | 199 | <button className="text-blue-600 hover:text-blue-700 text-sm font-medium"> |

Note: all static no-op candidates are in legacy/dormant components; none were detected in active routed modules by static scan.

### Click-Sweep Caveat

- The sampled Playwright click sweep reports 126 unchanged-click observations across 36 routes.
- This is treated as heuristic-only because click instrumentation catches and suppresses click failures internally, which can inflate false no-op counts.
- Actionable no-op decisions were therefore based on API behavior, route guards, and static wiring evidence.

## 6. Full Deep Mutation E2E Check List

| # | Status | Check | Detail |
|---:|---|---|---|
| 1 | PASS | health endpoint | status=200 |
| 2 | PASS | customers requires auth | status=401 |
| 3 | PASS | owner users/me | status=200 |
| 4 | PASS | owner users list | status=200 |
| 5 | PASS | owner audit logs | status=200 |
| 6 | PASS | admin audit blocked | status=403 |
| 7 | PASS | admin reports catalog access | status=200 |
| 8 | FAIL | admin users should be blocked by contract | status=200 |
| 9 | PASS | owner metrics | status=200 |
| 10 | PASS | metrics requires auth | status=401 |
| 11 | PASS | create account | status=201; body={"status":"success","data":{"id":"69c7ff7997c4fed5edc5c992","orgId":"69b66d3bea5902c3133269d4","bankName":"E2E Bank","ifscCode":"E2ET0000001","accountNo":"ACC1774714745168","upiId" |
| 12 | PASS | create vendor | status=201; body={"status":"success","data":{"id":"69c7ff7997c4fed5edc5c99a","orgId":"69b66d3bea5902c3133269d4","name":"E2E Vendor e2e-1774714744427","serviceType":"Airline","phone":"+919914745275" |
| 13 | PASS | get vendor by id | status=200 |
| 14 | PASS | update vendor | status=200 |
| 15 | PASS | vendor stats | status=200 |
| 16 | PASS | vendor search | status=200 |
| 17 | PASS | vendor account view | status=200 |
| 18 | PASS | create customer | status=201; body={"status":"success","data":{"id":"69c7ff7a97c4fed5edc5c9b2","orgId":"69b66d3bea5902c3133269d4","name":"E2E Customer e2e-1774714744427","phone":"+918814746179","email":"customer.e2e |
| 19 | PASS | get customer by id | status=200 |
| 20 | PASS | update customer | status=200 |
| 21 | PASS | customer search | status=200 |
| 22 | PASS | customer stats | status=200 |
| 23 | PASS | customer account view | status=200 |
| 24 | PASS | create booking | status=201; body={"status":"success","data":{"id":"69c7ff7b97c4fed5edc5c9c6","orgId":"69b66d3bea5902c3133269d4","customerId":"69c7ff7a97c4fed5edc5c9b2","bookingDate":"2026-03-28T16:19:07.075","curr |
| 25 | PASS | get booking by id | status=200 |
| 26 | PASS | booking update with falsy fields | status=200 |
| 27 | PASS | booking status transition (draft->confirmed) | status=200 |
| 28 | PASS | booking search | status=200 |
| 29 | PASS | booking filter | status=200 |
| 30 | PASS | booking stats | status=200 |
| 31 | PASS | create receivable payment | status=201; body={"status":"success","data":{"id":"69c7ff7c97c4fed5edc5c9e6","orgId":"69b66d3bea5902c3133269d4","paymentType":"RECEIVABLE","amount":400,"currency":"INR","paymentMode":"UPI","created |
| 32 | PASS | overpayment prevention | status=400 |
| 33 | PASS | create outbound refund | status=201; body={"status":"success","data":{"id":"69c7ff7c97c4fed5edc5c9f1","orgId":"69b66d3bea5902c3133269d4","paymentType":"REFUND_OUTBOUND","amount":400,"currency":"INR","paymentMode":"UPI","cr |
| 34 | PASS | create expense payment | status=201; body={"status":"success","data":{"id":"69c7ff7d97c4fed5edc5c9fa","orgId":"69b66d3bea5902c3133269d4","paymentType":"EXPENSE","amount":300,"currency":"INR","paymentMode":"UPI","createdBy" |
| 35 | PASS | create inbound refund | status=201; body={"status":"success","data":{"id":"69c7ff7d97c4fed5edc5ca02","orgId":"69b66d3bea5902c3133269d4","paymentType":"REFUND_INBOUND","amount":300,"currency":"INR","paymentMode":"UPI","cre |
| 36 | PASS | payments list | status=200 |
| 37 | PASS | payments filtered list RECEIVABLE | status=200 |
| 38 | PASS | payment by id | status=200 |
| 39 | PASS | existing customer report | status=200 |
| 40 | PASS | existing vendor report | status=200 |
| 41 | PASS | reporting center catalog | status=200 |
| 42 | PASS | report endpoint sales-by-customer-detail | status=200 |
| 43 | PASS | report endpoint customer-balance-detail | status=200 |
| 44 | PASS | report endpoint invoice-list | status=200 |
| 45 | PASS | report endpoint transaction-list-by-date | status=200 |
| 46 | PASS | report endpoint payment-splits-by-customer | status=200 |
| 47 | PASS | audit export csv | status=200; contentType=text/csv; charset=utf-8 |
| 48 | PASS | audit by entity | status=200 |
| 49 | PASS | last-owner / self deactivation protection | status=400 |
| 50 | PASS | files list | status=200 |
| 51 | PASS | ocr health endpoint | status=200 |
| 52 | PASS | ocr schema endpoint | status=200 |
| 53 | PASS | ocr invalid fileId handling | status=404 |
| 54 | FAIL | file upload | status=400; body={"status":"error","data":{"message":"File creation failed: Google Drive upload failed: invalid_grant"}} |

## 7. Artifact Index

- /tmp/travox-deep-mutation-e2e-checks.json
- /tmp/travox-deep-api-audit.json
- /tmp/travox-report-matrix-audit.json
- /tmp/travox-route-matrix.json
- /tmp/travox-ui-wiring-audit.json
- /tmp/travox-ui-click-audit-fast.json
- /tmp/travox-smoke-output.txt
- /tmp/travox-client-lint.txt
- /tmp/travox-client-build.txt
- /tmp/travox-server-build.txt
- /tmp/travox-reports-catalog.json

## 8. Recommended Fix Order

1. Enforce Owner-only access for `/users` endpoints to remove RBAC drift.
2. Resolve Google Drive `invalid_grant` to restore file upload workflow parity.
3. Make `customer-report-existing` and `vendor-report-existing` catalog items runnable from `/reports/:id`, or remove their direct-ID execution path from runner logic while keeping `/customers/report` and `/vendors/report` intact.
4. Tighten click-audit harness to fail loud on click errors (do not swallow), then re-baseline interaction no-op counts.
