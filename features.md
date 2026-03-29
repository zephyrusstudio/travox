# Travox Project Features (Comprehensive)

Last analyzed: March 28, 2026 (granular audit refresh)  
Repository: `travox` (`client` + `server`)

## 1. Product Overview

Travox is a B2B travel operations and finance platform with:

- Google-based authentication
- Organization-scoped multi-tenant data model
- Customer/vendor/booking lifecycle management
- Receivables, expenses, and refunds
- Owner-level audit logs
- AI-powered OCR extraction for travel documents
- File management backed by Google Drive
- Redis-backed caching around MongoDB repositories

## 2. Architecture and Stack

### Frontend (`client`)

- React 18 + TypeScript + Vite + Tailwind
- Axios-based API connector with automatic token refresh
- Route guards for authentication and role/module access
- Global typography set to `Plus Jakarta Sans`

### Backend (`server`)

- Express 5 + TypeScript
- Clean architecture style:
  - `api` (controllers/routes)
  - `application` (use-cases, repository/service interfaces)
  - `domain` (entities/business logic)
  - `infrastructure` (Mongo/Redis/Google adapters)
- MongoDB via Mongoose
- Redis cache layer with entity/list/stats TTLs
- Swagger docs at `/docs`

### Integrations

- Google OIDC (`/auth/google`)
- Google Drive (file upload/download/delete)
- Gemini OCR (`/scan`)

## 3. Active Frontend Modules (Routed)

These are currently wired in `client/src/routes/routeConfig.tsx` and visible via sidebar:

1. Customers (`/customers`)
2. Customer Report (`/customers/report`)
3. Vendors (`/vendors`)
4. Vendor Report (`/vendors/report`)
5. Bookings (`/bookings`)
6. Payments (`/payments`)
7. Expenses (`/expenses`)
8. Refunds (`/refunds`)
9. Audit Logs (`/logs`)
10. User Access (`/users`)

## 4. Present but Currently Non-Routed/Legacy Frontend Modules

The codebase still contains these feature areas, but they are not in active route config and sidebar entries are commented:

- Dashboard components
- Ledgers (`CustomerLedger`, `VendorLedger`, `OutstandingPayments`, `MonthlyIncomeExpense`, `GSTTaxView`)
- Calendar view
- Ticket upload manager (legacy Firebase + external OCR URL flow)
- Settings (`UserSettings`, `FirebaseSetup`)

Most of these rely on `useApp()` placeholder arrays and mock-like data patterns rather than current API workflows.

## 5. Role and Access Model

### Supported roles (current canonical model)

- `Owner`
- `Admin`

### Module access (frontend + backend aligned)

- Owner: all modules
- Admin: all except Audit Logs and User Access

### Endpoint-level restrictions

- `/audit-logs*` -> Owner only
- `/users*` (management actions) -> currently Admin/Owner in backend route guards
- Most other business routes -> authenticated users

### Verified contract gap (from granular audit)

- Product contract expects `User Access` to remain Owner-only.
- Current backend implementation still allows Admin on `/users` endpoints.
- This is a confirmed parity drift and appears in test results.

## 6. Core End-to-End Workflows

### A) Authentication and Session Lifecycle

1. User signs in via Google GIS on frontend (`AuthPage`).
2. Frontend sends ID token to `POST /auth/google`.
3. Backend verifies token, auto-creates/link user, assigns first org user as Owner.
4. Access token + refresh token issued and set as cookies; access token also stored client-side.
5. On 401, frontend attempts `POST /auth/refresh`.
6. If refresh fails, auth storage clears and session-expired modal is shown.

### B) Customer Lifecycle

1. Create customer with minimal required data (name).
2. Backend auto-fills default phone/email if omitted.
3. Backend creates placeholder account automatically and links it.
4. Search/list/update/delete supported.
5. Per-customer:
   - booking list
   - account retrieval
   - stats
6. Bulk import from CSV (`/customers/import`) with partial-success reporting.

### C) Vendor Lifecycle

1. Create vendor with required:
   - name
   - service type
   - at least phone or email
2. Duplicate checks by name+serviceType and contact fields.
3. List/search/update/delete supported.
4. Optional account linking for payout workflows.
5. Vendor stats and vendor report endpoints available.

### D) Booking Lifecycle

1. Create booking with required:
   - customer
   - currency
   - total amount
   - at least one PAX
2. Optional nested itineraries/segments with mode-specific minimum validation.
3. Booking form supports:
   - create/edit/view modes
   - inline customer creation
   - vendor linking
4. OCR assist:
   - upload ticket/pdf/image to `/scan?format=true`
   - extracted data pre-fills booking form
5. Search and advanced filter endpoints.
6. Status transitions:
   - Draft -> Confirmed (needs >=1 PAX)
   - Confirmed -> Ticketed (needs segment)
   - Complete checks travel end + due amount (or admin override)
7. Soft delete + archiving capabilities exist.

### E) Receivable Payment Workflow

1. User selects booking + customer-linked account.
2. `POST /payments/receivable` creates payment.
3. Backend prevents overpayment (`amount <= booking.dueAmount`).
4. Side effects:
   - booking paid/due updated
   - customer total spent updated
   - report caches invalidated

### F) Expense Workflow

1. User selects vendor (must have linked payout account in practice).
2. `POST /payments/expense` creates expense payment.
3. Vendor total expense is incremented.

### G) Refund Workflows

- Outbound refund (`/payments/outbound-refund`):
  - refund customer against original receivable
  - customer spend reduced
  - booking paid amount reduced and may become `Refunded`
- Inbound refund (`/payments/inbound-refund`):
  - refund received from vendor against original expense
  - vendor total expense reduced

### H) Reporting Workflow

- Customer report (`/customers/report`)
  - interval-based
  - optional `pendingOnly`
  - includes booking + payment breakdown
- Vendor report (`/vendors/report`)
  - interval-based expense aggregation
- Frontend export options:
  - CSV
  - Excel-compatible XML
  - print/PDF window

### I) User Access and Audit Workflow

- User management:
  - list users
  - change role
  - activate/deactivate (with protections like preventing last owner deactivation)
- Audit logs:
  - list/filter/export
  - detail modal with before/after payload view
  - audit entries generated for mutating operations via middleware + audit context

### J) File and OCR Workflow

- Files:
  - upload metadata + content (`/files`)
  - list/get/update/delete/download
  - ticket-kind file can auto-link to booking ticket ID
- OCR:
  - extract from upload or existing file ID
  - supports images + PDF
  - health endpoint (`GET /scan`)
  - schema endpoint (`GET /schema`) generated from domain model reflection

## 7. Data Protection and Multi-Tenancy

- Organization ID scoping is applied across repositories/use-cases.
- Sensitive-field masking supported on key entities:
  - customer passport/aadhaar
  - vendor GSTIN
  - booking pax passport
- `?unmask=true` query can request unmasked responses where supported.

## 8. Caching and Consistency Features

- Cached repositories for customers/vendors/bookings/payments/accounts/users.
- Typical TTLs:
  - entity: 5 min
  - list: 10-15 min
  - stats: 2 min
- Explicit cache invalidation exists for high-risk financial paths:
  - receivables
  - refunds
  - booking/payment/customer/vendor aggregate updates
- Cache metrics endpoints:
  - `GET /metrics`
  - `POST /metrics/reset`

## 9. Date/Timezone Behavior

- Backend parses/serializes date payloads with IST-oriented middleware.
- Frontend timezone utilities also preserve local date-time entry semantics.
- Reports and audit presentation use IST-aware formatting patterns.

## 10. Operational and Deployment Features

- Dockerfiles for client and server
- Compose variants (`compose.yml`, `build.yml`, `deploy.yml`)
- Redis service included in deployment topology
- Server health endpoint (`/health`) and ping (`/ping`)
- Swagger/OpenAPI docs (`/docs`)
- Redis flush maintenance script (`server/src/scripts/flushRedisCache.ts`)

## 11. Frontend UX/Platform Features

- Mobile unsupported gate with explicit "continue anyway" override
- Session-expired modal with forced re-login path
- Maintenance banner controlled via env flags:
  - `VITE_MAINTENANCE_MODE`
  - `VITE_MAINTENANCE_MESSAGE`
  - `VITE_MAINTENANCE_DETAILS`
- Hidden dark-mode toggle unlock (plane icon click sequence)

## 12. Notable Implementation Findings

1. Active production flow is API-driven for core modules; older dashboard/ledger/settings/tickets modules are present as legacy/non-primary surfaces.
2. Audit logger intentionally captures mutating operations and skips pure GET/view reads.
3. Booking route/controller capability includes additional paths (for example archive-adjacent flows) that are partly guarded or not primary in current routed UX.

## 13. Granular Audit Snapshot (March 28, 2026)

This snapshot reflects the latest deep rerun performed against local backend/frontend (`localhost:3000` + `localhost:5173`) with authenticated Owner/Admin tokens.

### Automated suite outcomes

1. Deep mutation E2E (`/tmp/travox-deep-mutation-e2e-checks.json`)
- Total checks: `54`
- Passed: `52`
- Failed: `2`

2. Deep API contract audit (`/tmp/travox-deep-api-audit.json`)
- Total checks: `50`
- Passed: `46`
- Failed: `4`

3. Reporting endpoint matrix (`/tmp/travox-report-matrix-audit.json`)
- Total checks: `132`
- Passed: `130`
- Failed: `2`

4. Frontend route matrix (`/tmp/travox-route-matrix.json`)
- Routes checked: `18`
- Passed: `18`
- Failed: `0`

5. UI button wiring scan (`/tmp/travox-ui-wiring-audit.json`)
- TSX files scanned: `88`
- Total button tags scanned: `150` (`104` custom + `46` native)
- Potential no-op controls: `5` (all in legacy/dormant components)

6. UI sampled click sweep (`/tmp/travox-ui-click-audit-fast.json`)
- Routes sampled: `36`
- Visible buttons seen: `307`
- Sampled clicks executed: `126`
- Unchanged-click observations: `126` (heuristic-only; see note below)

### Confirmed failing areas

1. Backend RBAC drift for user-management endpoints
- Admin can still access `/users` endpoints (`200`) where Owner-only product contract expects block.

2. File upload pipeline failure
- `POST /files` returns `400` with `Google Drive upload failed: invalid_grant`.

3. Reporting catalog ID mismatch for existing reports
- `customer-report-existing` and `vendor-report-existing` appear in `/reports/catalog` but `GET /reports/:id` returns unsupported `404` for both IDs.

### Verified working areas

- Auth-required protection for core business endpoints (public access blocked).
- Owner access to `GET /metrics` and `POST /metrics/reset` works; Admin gets blocked for owner-only metrics access.
- Customer, vendor, booking, payment, refund, audit export/detail, and reporting core APIs pass deep mutation checks except the failures listed above.
- Reporting namespace supports all newly added report IDs in matrix checks.
- Frontend active and legacy-boundary routes resolve to shell (`18/18` in route matrix).
- Sidebar scroll behavior is correctly configured (`overflow-y: auto`) and scrolls under constrained viewport probe.
- Build/lint gates in this run passed:
  - client lint
  - client build
  - server build
  - revamp smoke script

### Audit environment note

- Click-sweep output is retained as a broad signal, not a source-of-truth defect list, because the harness swallows click exceptions and can overcount no-op observations.
- Final pass/fail decisions are grounded on mutation/API/reporting matrix checks, route matrix, smoke checks, and static button wiring scan.

## 14. Feature Summary by Domain

- Auth: Google login, JWT access/refresh rotation, cookie + bearer support
- Customers: CRUD, search, CSV import, stats, linked account, bookings report
- Vendors: CRUD, search, stats, linked account, expense report
- Bookings: rich nested model, OCR prefill, search/filter, status lifecycle, soft delete
- Payments: receivables, expenses, inbound/outbound refunds, list/count/by-id
- Accounts: CRUD + archive, used for customer/vendor/payment linkage
- Files: upload/list/download/delete via Google Drive
- OCR: extraction + schema introspection + health
- Users: role/status management, profile updates
- Audit: immutable write-action logs + CSV export
- Ops: redis caching, metrics, health/docs, containerized deployment
