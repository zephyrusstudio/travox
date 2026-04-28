# Travox Master QA Audit Prompt / Operating Manual

This file is the single source of truth for full-platform QA auditing in Travox. It is written for Codex and is intended to be reused across multiple future sessions without relying on prior chat context.

Use this file in one of two ways:
- Run a full audit end to end.
- Run one batch or a small set of related batches, preserve findings, and continue in later sessions.

This is an operations manual, not a lightweight checklist. It is grounded in the current repository structure:
- Frontend: React 18 + TypeScript + Vite in `client/`
- Backend: Express 5 + TypeScript in `server/`
- Persistence: MongoDB + Mongoose, Redis-backed cached repositories
- External integrations: Google OIDC, Google Drive file storage, Gemini OCR
- Primary docs already in repo: `features.md`, `reporting-features.md`, `docs/revamp/*`

## How To Use This Prompt In Codex

Run one batch or a small group of adjacent batches per session. Do not try to infer prior findings from memory alone; restate the completed batches, open defects, blocked areas, and remaining scope at the top of every new session.

Preserve outputs across sessions in a structured way:
- feature inventory snapshot
- route/API inventory snapshot
- batch findings tables
- evidence artifact paths
- open defect list
- retest list

Do not issue a release verdict until all critical batches are complete. If only partial coverage was executed, state exactly which batches were skipped and how that limits confidence.

## 1. Title And Usage Note

This is the Travox master QA audit prompt/manual for Codex. It is intended to serve as:
- the one full audit prompt for the project
- the one batchable audit guide for smaller sessions
- the one reusable release-readiness QA manual for this repository

The auditor must derive the product surface from code first, not from assumptions, screenshots, or stale docs alone.

## 2. Non-Negotiable Operating Rules

- Do not use destructive git commands.
- Do not stage, commit, or push unless explicitly requested.
- Do not mark a scenario as passed without evidence.
- Do not treat route load as feature success.
- Do not silently skip inaccessible or flaky areas; record the reason.
- Do not write vague findings such as "looks okay" or "mostly works."
- Do not confuse hidden UI with actual access control.
- Do not confuse extraction quality with business-logic quality in OCR flows.
- Do not confuse stale docs with runtime truth; code wins over docs.
- Do not claim release safety unless all critical batches are complete.
- Do not rely only on frontend behavior for protected features; verify backend contract and role behavior.
- Do not assume dormant components are harmless; inspect them if they are reachable, imported, or can contaminate build/runtime confidence.
- Do not collapse environment failures into product failures without labeling the distinction.

Evidence standard:
- every pass needs a direct observation, command result, API response, browser trace, screenshot, or code-backed justification
- every fail needs repro steps, actual result, expected result, and suspected scope
- every skipped item needs a reason and a follow-up condition

## 3. Code Inspection Protocol

Before testing, inspect the real architecture anchors in this order.

### Frontend entry and routing

Inspect:
- `client/src/main.tsx`
- `client/src/App.tsx`
- `client/src/routes/routeConfig.tsx`
- `client/src/routes/PrivateRoute.tsx`
- `client/src/routes/PublicRoute.tsx`
- `client/src/components/ui/Layout.tsx`

Derive:
- public route entrypoint: `/`
- protected modern routes: `/customers`, `/reports`, `/reports/:reportId`, `/customers/report`, `/vendors`, `/vendors/report`, `/bookings`, `/payments`, `/expenses`, `/refunds`, `/logs`, `/users`
- protected legacy boundary route: `/legacy/:surface`
- platform gates: mobile unsupported screen, maintenance banner, session-expired modal, hidden dark-mode unlock, command palette, quick actions

### Frontend state and service model

Inspect:
- `client/src/contexts/AppContext.tsx`
- `client/src/utils/apiConnector.ts`
- `client/src/utils/roleAccess.ts`
- `client/src/services/auditLogService.ts`
- `client/src/services/userService.ts`
- `client/src/types/index.ts`
- `client/src/components/reports/reportingExport.ts`

Derive:
- session storage and local storage keys
- current user derivation logic
- token refresh behavior
- role normalization behavior
- toast/error propagation behavior
- absence of a real central store beyond local React state + storage-backed auth
- placeholder/mock risk in `useApp()` and legacy components

### Frontend page and module entrypoints

Inspect all page files under `client/src/pages/`:
- `AuditLogsPage.tsx`
- `BookingsPage.tsx`
- `CustomerReportPage.tsx`
- `CustomersPage.tsx`
- `ExpensesPage.tsx`
- `LegacySurfacePage.tsx`
- `PaymentsPage.tsx`
- `RefundsPage.tsx`
- `ReportRunnerPage.tsx`
- `ReportsCenterPage.tsx`
- `UsersPage.tsx`
- `VendorReportPage.tsx`
- `VendorsPage.tsx`

Inspect major module components:
- customers
- vendors
- bookings
- payments
- expenses
- refunds
- reports
- audit logs
- users
- tickets/settings/dashboard/ledgers/calendar legacy components

### Backend entry and HTTP model

Inspect:
- `server/src/index.ts`
- `server/src/server.ts`
- `server/src/api/routes.ts`
- every file under `server/src/api/routes/`
- `server/src/middleware/requireAuth.ts`
- `server/src/api/controllers/*.ts`

Derive:
- protected vs public endpoints
- owner-only endpoints
- report namespace
- file/OCR endpoints
- metrics endpoints
- where audit middleware is attached

### Backend domain, persistence, and integration model

Inspect:
- `server/src/domain/*.ts`
- `server/src/models/FirestoreTypes.ts`
- `server/src/infrastructure/repositories/mongodb/*.ts`
- `server/src/config/container.ts`
- `server/src/config/mongodb.ts`
- `server/src/config/redis.ts`
- `server/src/infrastructure/services/JwtService.ts`
- `server/src/infrastructure/services/GoogleDriveService.ts`
- `server/src/services/GeminiOCRService.ts`

Derive:
- entity identities and status enums
- multi-tenant org scoping
- cache boundaries and invalidation risks
- external dependency requirements
- fallback behaviors such as local file storage

### Existing docs and scripts

Inspect:
- `features.md`
- `reporting-features.md`
- `docs/revamp/architecture-note.md`
- `docs/revamp/parity-matrix.md`
- `docs/revamp/migration-log.md`
- `docs/revamp/smoke-checklist.md`
- `docs/revamp/test-suite-report.md`
- `scripts/smoke/revamp-smoke.sh`
- `client/README.md`
- `server/README.md`

Use docs for context only. If docs conflict with code, code is authoritative.

## 4. Code-Derived Feature Inventory Protocol

Build an inventory before executing deeper test batches. For every discovered surface, record:

| Field | Required content |
|---|---|
| Feature key | Stable internal label such as `customers.list` or `reports.invoice-list` |
| Domain/module | Auth, customers, vendors, bookings, payments, expenses, refunds, reports, audit, users, files, OCR, legacy |
| Route or endpoint | Exact frontend route or backend endpoint |
| Nav group | Operations, Finance, Reporting, Administration, Legacy boundary, Hidden/internal |
| Entrypoint file | Actual page/component/controller file |
| Access type | Public, authenticated, owner-only, hidden-but-reachable, internal-only |
| Runtime status | Active route, active API only, legacy boundary, dormant code only |
| Backend dependencies | Exact API routes/use cases/repositories involved |
| Persistence dependencies | Mongo, Redis cache, Google Drive, local file storage fallback, Gemini OCR, local/session storage |
| Risk level | Critical, high, medium, low |
| Priority | P0 release blocker, P1 major flow, P2 secondary flow, P3 legacy/static review |
| Notes | Known caveats, env dependencies, doc drift, derived behavior |

Rules:
- route registry is authoritative over sidebar-only visibility
- hidden routes still count if directly reachable
- API-only features still count if used by UI
- backend-connected features always need deeper audit than simple route load
- generic legacy boundaries do not prove dormant legacy components are safe; inspect both runtime boundary and dormant code artifacts

### Current code-derived feature surface

Use this as the baseline starting point.

#### Public frontend
- `/` -> Google login page via `client/src/components/auth/AuthPage.tsx`

#### Protected modern frontend routes
- `/customers`
- `/reports`
- `/reports/:reportId`
- `/customers/report`
- `/vendors`
- `/vendors/report`
- `/bookings`
- `/payments`
- `/expenses`
- `/refunds`
- `/logs`
- `/users`

#### Protected legacy boundary routes
- `/legacy/dashboard`
- `/legacy/ledgers`
- `/legacy/calendar`
- `/legacy/settings`
- `/legacy/tickets`

#### Protected supporting backend APIs without direct top-level route
- `/accounts*`
- `/files*`
- `/scan`
- `/schema`
- `/metrics`
- `/metrics/reset`
- `/users/me`
- `/health`
- `/ping`
- `/docs`

#### Dormant but audit-relevant component directories
- `client/src/components/dashboard/*`
- `client/src/components/ledgers/*`
- `client/src/components/calendar/*`
- `client/src/components/settings/*`
- `client/src/components/tickets/*`

## 5. Batch Execution Index

Use these batches as the canonical execution order. Each batch can be run independently if needed, but partial audits reduce confidence.

### Recommended batch order

1. Batch 00: discovery and inventory lock
2. Batch 01: environment and platform gates
3. Batch 02: auth and session lifecycle
4. Batch 03: shell, navigation, and route access
5. Batch 04: customers
6. Batch 05: vendors
7. Batch 06: bookings core UI
8. Batch 07: OCR, files, and booking prefill
9. Batch 08: receivable payments
10. Batch 09: expenses and vendor payouts
11. Batch 10: refunds and aggregate coherence
12. Batch 11: reporting center and report runner
13. Batch 12: existing customer/vendor reports and exports
14. Batch 13: new accounting-style reports
15. Batch 14: audit logs
16. Batch 15: user access and role enforcement
17. Batch 16: cache, persistence, org scoping, and cross-session coherence
18. Batch 17: legacy boundaries and dormant component contamination
19. Batch 18: accessibility, responsive behavior, and keyboard/focus
20. Batch 19: release smoke, defect packaging, and verdict

### Minimum rule for partial audits

No release confidence may be claimed unless Batches 00-03, 04-10, 11-12, 14-16, and 19 are complete. Skipping any of those limits release confidence materially.

### Batch 00

What it covers:
- code inspection
- route and endpoint inventory
- module list
- environment dependency list

Which sections of the master prompt to execute:
- Sections 3, 4, 6, 14, 15

Expected outputs:
- feature inventory table
- route map
- endpoint map
- list of missing env/services that can block later batches

### Batch 01

What it covers:
- server/bootstrap requirements
- frontend bootstrap
- Mongo/Redis integration availability
- docs drift awareness
- maintenance/mobile/dark-mode/session platform gates inventory

Which sections of the master prompt to execute:
- Sections 3, 11, 13, 15, 18

Expected outputs:
- environment readiness summary
- platform gate checklist
- blocked-vs-product issue separation

### Batch 02

What it covers:
- public auth page
- Google GIS loading
- `/auth/google`
- `/auth/refresh`
- logout/session expiry
- cookie/storage/CORS interaction

Which sections of the master prompt to execute:
- Sections 7, 9, 10, 11, 13, 14

Expected outputs:
- auth flow evidence
- session lifecycle findings
- CORS/cookie/env dependency notes

### Batch 03

What it covers:
- app shell
- sidebar
- breadcrumbs
- quick actions
- command palette
- route guards
- direct URL behavior for protected routes

Which sections of the master prompt to execute:
- Sections 7, 9, 11, 12, 14, 15

Expected outputs:
- route access matrix by persona
- navigation defect list
- shell interaction findings

### Batch 04

What it covers:
- customers list
- search
- create/edit/delete
- linked account flow
- booking history modal
- CSV import

Which sections of the master prompt to execute:
- Sections 8, 9, 10, 11, 13, 14

Expected outputs:
- customer workflow findings
- account-link findings
- import behavior findings

### Batch 05

What it covers:
- vendors list
- search
- create/edit/delete
- linked account flow
- stats and vendor report navigation entry

Which sections of the master prompt to execute:
- Sections 8, 9, 10, 11, 13, 14

Expected outputs:
- vendor workflow findings
- duplicate/service-type validation findings
- payout-account dependency findings

### Batch 06

What it covers:
- bookings list
- search
- filters
- stats
- create/edit/view modal flows
- inline customer creation
- nested pax/itineraries/segments
- status actions
- delete flow

Which sections of the master prompt to execute:
- Sections 8, 9, 10, 11, 13, 14

Expected outputs:
- booking scenario matrix
- field-level validation findings
- status-transition findings

### Batch 07

What it covers:
- OCR upload
- OCR by `fileId`
- `format=true` booking prefill
- `/scan` health
- `/schema`
- file upload/list/get/download/delete
- Google Drive vs local fallback behavior

Which sections of the master prompt to execute:
- Sections 8, 10, 11, 13, 14, 16

Expected outputs:
- OCR/file matrix
- extraction-vs-logic defect separation
- external dependency findings

### Batch 08

What it covers:
- receivable payments list
- payment modal
- booking selection
- outstanding balance handling
- receipt generation/reference behavior
- overpayment prevention

Which sections of the master prompt to execute:
- Sections 8, 10, 11, 13, 14

Expected outputs:
- payment creation findings
- aggregate update findings
- duplicate-submission findings

### Batch 09

What it covers:
- expenses list
- expense modal
- vendor selection
- vendor-account requirement
- category/receipt/notes fields

Which sections of the master prompt to execute:
- Sections 8, 10, 11, 13, 14

Expected outputs:
- expense workflow findings
- vendor linkage findings
- payout account dependency findings

### Batch 10

What it covers:
- refund management
- outbound refund modal
- inbound refund flow
- original payment selection
- sign conventions
- booking/customer/vendor aggregate coherence

Which sections of the master prompt to execute:
- Sections 8, 10, 11, 13, 14, 20

Expected outputs:
- refund flow findings
- aggregate consistency findings
- regression list touching bookings, customers, vendors, reports

### Batch 11

What it covers:
- reporting center
- catalog load
- category grouping
- search
- route navigation
- report runner shell
- shared filters

Which sections of the master prompt to execute:
- Sections 9, 10, 11, 13, 14, 16

Expected outputs:
- reporting shell findings
- route/registry consistency findings
- filter UI findings

### Batch 12

What it covers:
- `/customers/report`
- `/vendors/report`
- export behavior
- print/PDF behavior
- legacy-direct report route preservation

Which sections of the master prompt to execute:
- Sections 9, 10, 11, 13, 14, 18

Expected outputs:
- existing report parity findings
- export/print evidence
- filename/content-shape notes

### Batch 13

What it covers:
- `/reports/:reportId` for new accounting-style reports
- catalog-to-endpoint integrity
- row totals
- running balances
- derived-field honesty

Which sections of the master prompt to execute:
- Sections 9, 10, 11, 13, 14, 16

Expected outputs:
- per-report correctness table
- derived-vs-real-field notes
- export and print findings for new reports

### Batch 14

What it covers:
- audit logs list
- pagination
- actor dereferencing
- detail modal
- export CSV
- owner-only enforcement

Which sections of the master prompt to execute:
- Sections 7, 9, 11, 12, 13, 14

Expected outputs:
- audit log access findings
- export findings
- diff rendering findings

### Batch 15

What it covers:
- users list
- role changes
- activation/deactivation
- self-protection
- last-owner protection
- owner-only access

Which sections of the master prompt to execute:
- Sections 7, 9, 10, 11, 12, 13, 14

Expected outputs:
- role/access findings
- state update findings
- direct URL denial findings

### Batch 16

What it covers:
- org scoping
- masking/unmask
- cache freshness
- report invalidation
- refresh persistence
- wrong-record and stale-state traps

Which sections of the master prompt to execute:
- Sections 7, 11, 12, 13, 14, 20

Expected outputs:
- coherence defect list
- cross-session contamination findings
- stale-cache findings

### Batch 17

What it covers:
- `/legacy/*` boundaries
- dormant dashboard/ledger/calendar/settings/tickets code
- stale Firebase and external OCR contamination
- no-op CTA scan in dormant areas

Which sections of the master prompt to execute:
- Sections 9, 10, 15, 17

Expected outputs:
- legacy boundary findings
- dormant-code risk list
- release relevance classification

### Batch 18

What it covers:
- keyboard navigation
- focus visibility
- modal trapping basics
- zoom/scroll behavior
- mobile unsupported flow
- continue-anyway persistence

Which sections of the master prompt to execute:
- Sections 9, 10, 11, 17, 18

Expected outputs:
- accessibility/responsive findings
- platform gate behavior findings

### Batch 19

What it covers:
- final smoke suite
- no-go conditions
- defect packaging
- retest list
- release verdict

Which sections of the master prompt to execute:
- Sections 16, 17, 18, 19, 20, 21

Expected outputs:
- final smoke evidence
- prioritized defect log
- retest matrix
- release-risk summary

## 6. Core Audit Questions

The audit must answer all of these questions with evidence:

- What product surfaces actually exist in code today?
- Which are public, authenticated, owner-only, hidden, legacy-boundary, or dormant?
- Which flows are real production flows versus placeholder/mock-era leftovers?
- Do the critical workflows work end to end through the actual backend?
- Does state stay attached to the correct record across search, pagination, modal open/close, refresh, and navigation?
- Are role and access controls enforced both in UI and backend?
- Are org-scoped boundaries respected?
- Are masked fields only unmasked where supported and intended?
- Are cache and refresh behaviors coherent after mutations?
- Are exports, downloads, and print outputs correct and truthful?
- Do external integrations fail safely and truthfully?
- What issues are environment-only, what issues are product bugs, and what issues are contract drift?
- Is the current build safe to release, and if not, what must be fixed first?

## 7. Personas And Access Contexts

Travox currently exposes these meaningful personas and contexts.

### Persona A: unauthenticated visitor

Must test:
- access to `/`
- direct URL attempts to protected routes
- direct URL attempts to protected APIs
- no privileged content flash before redirect
- no leaked cached data from prior sessions

### Persona B: authenticated Admin

Must test:
- access to customers, vendors, bookings, payments, expenses, refunds, reports
- denial for `/logs` and `/users`
- denial for owner-only APIs such as `/audit-logs*`, `/users*`, `/metrics*`
- direct URL denial behavior and redirect target
- no cached owner content showing after owner->admin session swap

### Persona C: authenticated Owner

Must test:
- access to all active modules
- audit and user management
- metrics endpoints
- role and activation mutations
- report and export access

### Persona D: cross-org user

If a second org test identity exists, must test:
- inability to read or mutate data from another org by direct URL or API id substitution
- inability to download another org’s file
- inability to view another org’s audit logs, reports, bookings, or users

### Persona E: deactivated or expired-session user

Must test:
- refresh failure behavior
- modal behavior
- forced re-login path
- no stale privileged UI after expiry

There is no billing/credits/plan model currently visible in runtime code. Do not invent billing personas. Instead, focus on auth, role, org, and legacy/internal boundaries.

## 8. Test Asset / Input Protocol

Travox is both entity-driven and file-driven. Future auditors must track all test assets explicitly.

### Required entity fixtures

Prepare or document at minimum:
- Org A Owner
- Org A Admin
- Org B Owner or Admin if cross-org testing is possible
- one minimal customer
- one customer with passport/aadhaar/gstin data for masking checks
- one customer with linked account
- one vendor with linked payout account
- one vendor without linked account
- one draft booking
- one booking with pax only
- one booking with itinerary/segment
- one booking with outstanding due
- one receivable payment
- one expense payment
- one outbound refund
- one inbound refund

For every created record, capture:
- id
- org id
- route where created
- API endpoint used
- current lifecycle state
- related record ids

### Required file fixtures

Prepare or document:
- one valid PDF for OCR
- one valid image for OCR
- one invalid OCR file type
- one file for `/files` upload unrelated to OCR if possible
- one CSV for customer import with only valid rows
- one CSV for customer import with mixed valid and invalid rows

For every file, track:
- filename
- mime type
- size
- upload route and endpoint
- returned file id
- whether storage backend was Google Drive or local fallback
- whether OCR used direct upload or `fileId`

### Wrong-record / wrong-identity checks

Every entity and file scenario must include at least one wrong-record probe:
- open record A, switch filters/pages, confirm actions still target record A only when intended
- attempt direct API fetch by another org id if possible
- ensure modal content matches the selected row after list refresh

## 9. Full Route / Screen Audit Protocol

Audit every route, screen, tab, modal, drawer, panel, and major feature entrypoint.

For each active route:
- route path
- expected persona access
- page entrypoint file
- module component entrypoint file
- direct load behavior
- refresh behavior
- navigation away and back
- loading state
- empty state
- error state
- retry state
- stale data behavior
- visible CTAs
- visible filters
- modal/drawer/panel inventory

### Frontend route list to audit

#### Public
- `/`

#### Protected modern
- `/customers`
- `/reports`
- `/reports/:reportId`
- `/customers/report`
- `/vendors`
- `/vendors/report`
- `/bookings`
- `/payments`
- `/expenses`
- `/refunds`
- `/logs`
- `/users`

#### Protected legacy boundary
- `/legacy/dashboard`
- `/legacy/ledgers`
- `/legacy/calendar`
- `/legacy/settings`
- `/legacy/tickets`

### Screen-specific notes

#### `/`
- `client/src/components/auth/AuthPage.tsx`
- Google GIS script load
- popup behavior
- loading state
- network/CORS failure truthfulness

#### Shared shell on protected pages
- `client/src/components/ui/Layout.tsx`
- grouped nav
- sidebar scrollability at zoom
- command palette `Ctrl/Cmd+K`
- quick actions behavior on same-route vs cross-route actions
- hidden dark mode unlock after 7 logo clicks
- logout behavior and reload

#### Legacy boundary route
- `client/src/pages/LegacySurfacePage.tsx`
- confirm boundary copy is truthful
- confirm no dead navigation loops
- confirm it does not pretend dormant legacy functionality is live

## 10. Form And Interaction Audit Protocol

For every form, document:
- page or modal purpose
- exact fields
- input types
- default values
- required vs optional
- placeholder/help text
- validation rules
- submit action
- cancel/reset/close behavior
- dirty-state behavior
- retry behavior
- refresh behavior
- keyboard and focus basics
- responsive/zoom behavior

### Form inventory to exercise

#### Customer form
- file: `client/src/components/customers/CustomerFormModal.tsx`
- fields: name, email, phone, passportNo, aadhaarNo, visaNo, gstin, optional account subform
- validation highlights: name required, phone 10 digits, email pattern, aadhaar 12 digits, GSTIN 15 alphanumeric, passport max 8 alphanumeric
- account subform supports UPI or account+IFSC combination in this form path

#### Vendor form
- file: `client/src/components/vendors/VendorFormModal.tsx`
- fields: name, serviceType, pocName, email, phone, gstin, optional linked account details
- validation highlights: service type required, name required, at least phone or email expected by backend semantics

#### Account link modal
- file: `client/src/components/ui/common/AccountFormModal.tsx`
- fields: bankName, ifscCode, branchName, accountNo, upiId
- validation highlights: modal currently requires bankName, IFSC, branchName, accountNo for submission
- verify entity update after account creation uses correct customer/vendor endpoint

#### Booking form
- files: `client/src/components/bookings/BookingFormV2.tsx`, `client/src/components/bookings/useBookingFormV2.ts`
- fields:
  - main: customerId, currency, totalAmount, bookingDate, packageName, pnrNo, modeOfJourney, status, vendorId
  - pax rows: paxName, paxType, sex, passportNo, dob
  - itinerary rows: itinerary name, segments
  - segment fields depend on `ModeOfJourney`
- validation highlights:
  - customer required
  - currency required
  - totalAmount required
  - at least one valid pax required by business flow
  - status transition rules enforced server-side
  - mode-specific segment visibility and minimum fields
- special interactions:
  - inline customer creation
  - OCR upload and processed prefill
  - create/edit/view modes must remain coherent

#### Payment form
- file: `client/src/components/payments/PaymentForm.tsx`
- fields: booking, payment date, amount, payment mode, receipt number, notes
- validation highlights: booking required, only bookings with positive balance shown, amount numeric, receipt required

#### Expense form
- file: `client/src/components/expenses/ExpenseForm.tsx`
- fields: vendor, amount, currency, payment mode, receipt number, category, notes
- validation highlights: vendor required, payment mode required, submit disabled when selected vendor lacks linked account

#### Refund form
- file: `client/src/components/refunds/CreateRefundDialog.tsx`
- fields: payment to refund, refund date, refund mode, refund amount, refund reason
- validation highlights: only unrefunded receivable payments shown in outbound-refund dialog, selected payment auto-fills booking and amount

#### User management interactions
- file: `client/src/components/users/UserManagement.tsx`
- controls: role select, activation toggle
- validation highlights: current user cannot modify own status or role from this table path

#### Audit log detail interaction
- files: `client/src/components/auditLogs/AuditLogsManagement.tsx`, `AuditLogTable.tsx`, `AuditLogDetailModal.tsx`
- controls: export CSV, pagination, detail modal open/close

## 11. State, Persistence, And Coherency Audit Protocol

Travox uses mostly local React state per module, with auth/session state derived from browser storage and cookies. Audit coherence explicitly.

### State sources to audit

- `localStorage` and `sessionStorage` for `travox-at` and `travox-ua` or env-overridden keys
- auth cookies set by backend: `travox-at` and `refreshToken`
- per-screen local state in management components
- derived role access via `client/src/utils/roleAccess.ts`
- backend Redis cache for entity/list/stats/report paths
- MongoDB as source of truth
- optional local file storage under `server/tmp/file-storage` when Google Drive is unavailable or configured off

### Coherency traps to check

- wrong modal targets after pagination or refresh
- search results diverging from paginated list after mutation
- quick actions on same route not dispatching correctly
- report data remaining stale after booking/payment/refund writes
- deleted record still visible after refresh
- customer/vendor account link not reflected after modal close
- booking paid/due numbers inconsistent after receivable/refund actions
- user role/status changes not reflected immediately in table
- session-expired modal showing but stale protected page remaining interactive underneath
- storage carry-over from owner session to admin session

### Required coherency probes

- mutate a record, then refresh screen
- mutate a record, then navigate away and back
- mutate a record, then load related module
- mutate a record, then rerun report containing that record
- log out, log in as another role, revisit same route

## 12. Access-Control, Entitlement, And Internal-Boundary Audit Protocol

There is no billing or credit system in the current repo. Replace billing checks with access-boundary and legacy-boundary checks.

### Public vs protected

Verify:
- `/` is public
- protected routes do not expose data without token
- protected APIs reject missing token

### Role gating

Frontend model in `client/src/utils/roleAccess.ts`:
- Owner: all modules
- Admin: customers, vendors, bookings, payments, expenses, refunds
- Admin denied: logs, users

Backend route expectations from `server/src/api/routes/*.ts`:
- `/audit-logs*` owner only
- `/users*` owner only except `/users/me` and `/users/me` update for authenticated user
- `/metrics*` owner only
- report namespace requires Admin or Owner

Verify:
- direct URL denial
- redirect target correctness
- no privileged content flash
- backend denies even if frontend is bypassed

### Hidden/internal/legacy boundary

Verify:
- `/legacy/*` requires auth
- dormant legacy component code does not accidentally bypass main auth model
- no stale Firebase-only screen is promoted as production-ready through active routing

### Org scoping

Verify every sensitive read/write path is scoped by `req.user.orgId` or equivalent repository behavior:
- customers
- vendors
- bookings
- payments
- files
- reports
- audit logs
- users

## 13. Backend / API / Function Contract Audit Protocol

Audit the backend contract, not just UI outcomes.

### Public endpoints
- `POST /auth/google`
- `POST /auth/refresh`
- `GET /health`
- `GET /ping`
- `GET /docs`

### Authenticated business endpoints

Customers:
- `POST /customers`
- `POST /customers/import`
- `GET /customers`
- `GET /customers/search`
- `GET /customers/report`
- `GET /customers/:id`
- `PUT /customers/:id`
- `GET /customers/:id/stats`
- `GET /customers/:id/bookings`
- `GET /customers/:id/account`
- `DELETE /customers/:id`

Vendors:
- `POST /vendors`
- `GET /vendors`
- `GET /vendors/search`
- `GET /vendors/report`
- `GET /vendors/:id`
- `PUT /vendors/:id`
- `GET /vendors/:id/stats`
- `GET /vendors/:id/account`
- `DELETE /vendors/:id`

Bookings:
- `POST /bookings`
- `GET /bookings`
- `GET /bookings/search`
- `GET /bookings/filter`
- `GET /bookings/upcoming`
- `GET /bookings/overdue`
- `GET /bookings/revenue-stats`
- `GET /bookings/stats`
- `GET /bookings/travel-dates`
- `GET /bookings/:id`
- `PUT /bookings/:id`
- `PATCH /bookings/:id/status`
- `PATCH /bookings/:id/cancel`
- `PATCH /bookings/:id/confirm`
- `PATCH /bookings/:id/complete`
- `DELETE /bookings/:id`

Payments and refunds:
- `POST /payments/receivable`
- `POST /payments/expense`
- `POST /payments/inbound-refund`
- `POST /payments/outbound-refund`
- `GET /payments`
- `GET /payments/:id`

Accounts:
- `GET /accounts`
- `GET /accounts/:id`
- `POST /accounts`
- `PUT /accounts/:id`
- `DELETE /accounts/:id`
- `POST /accounts/:id/archive`

Files and OCR:
- `POST /files`
- `GET /files`
- `GET /files/:id`
- `GET /files/:id/download`
- `PUT /files/:id`
- `DELETE /files/:id`
- `POST /scan`
- `GET /scan`
- `GET /schema`

Reports:
- `GET /reports/catalog`
- `GET /reports/:reportId`
- preserved endpoints `GET /customers/report`, `GET /vendors/report`

Owner-only/admin endpoints:
- `GET /audit-logs`
- `GET /audit-logs/export`
- `GET /audit-logs/entity/:entity/:entityId`
- `GET /audit-logs/actor/:actorId`
- `GET /audit-logs/date-range`
- `GET /users`
- `GET /users/me`
- `PUT /users/me`
- `GET /users/:id`
- `PATCH /users/change-role`
- `PATCH /users/:id/activate`
- `PATCH /users/:id/deactivate`
- `GET /metrics`
- `POST /metrics/reset`

### Contract questions per endpoint

For each important endpoint, verify:
- request shape
- required params
- optional params
- response shape
- failure shape
- status codes
- timeout/retry truthfulness
- idempotency or duplicate-submission behavior
- org scoping
- role enforcement
- cache invalidation side effects where applicable

### External dependency boundaries

Call out separately:
- Google OIDC token verification
- CORS config via `CORS_ORIGIN`
- Google Drive storage vs local fallback
- Gemini OCR availability and model responses
- Redis availability and stale-cache implications

## 14. Module-By-Module Audit Protocol

Audit each module using the exact structure below.

### Auth and session platform

- Purpose: public entry, Google login, refresh recovery, session-expired handling
- Routes: `/`
- Entrypoints: `client/src/components/auth/AuthPage.tsx`, `client/src/App.tsx`, `server/src/api/routes/authRoutes.ts`, `server/src/api/controllers/AuthController.ts`
- Primary UI surfaces: login card, GIS button, error state, spinner, session-expired modal
- Primary actions: login, refresh, logout, expired-session re-entry
- Persistence model: cookies + local/session storage
- Access model: public entry, authenticated redirect when token exists
- Common failure modes: GIS script load failure, CORS/preflight failure, bad idToken, refresh loop, stale token in storage
- Severity if broken: critical

### Customers

- Purpose: customer CRUD, search, stats, booking history, account linking, import
- Route: `/customers`
- Entrypoints: `client/src/pages/CustomersPage.tsx`, `client/src/components/customers/*`, `server/src/api/routes/customerRoutes.ts`
- Primary UI surfaces: page header, stats cards, search, table, pagination, customer modal, account modal, bookings modal, delete confirm
- Primary forms/inputs: customer fields, optional bank/UPI details, CSV file input
- Primary actions: create, edit, delete, search, navigate to report, manage account, view bookings, import CSV
- Expected outputs: persisted customer, refreshed table, updated linked account, accessible stats/bookings/account endpoints
- Persistence model: Mongo customer + account repositories, Redis cached customer repo
- Backend dependencies: customers, accounts, bookings, audit
- Access model: Owner/Admin
- Common failure modes: masked/unmasked drift, stale search results, account link not reflected, import partial-success not surfaced
- Severity if broken: critical

### Vendors

- Purpose: vendor CRUD, search, stats, account linking, vendor report entry
- Route: `/vendors`
- Entrypoints: `client/src/pages/VendorsPage.tsx`, `client/src/components/vendors/*`, `server/src/api/routes/vendorRoutes.ts`
- Primary UI surfaces: stats cards, search, vendor table, vendor modal, account modal, delete confirm
- Primary forms/inputs: name, serviceType, pocName, email/phone, gstin, optional account details
- Primary actions: create, edit, delete, search, manage account, navigate to vendor report
- Expected outputs: persisted vendor, enforced duplicate rules and service type semantics, reflected account state
- Persistence model: Mongo vendor + account, Redis cached vendor repo
- Backend dependencies: vendors, accounts, payments, reports, audit
- Access model: Owner/Admin
- Common failure modes: duplicate validation mismatch, missing linked account semantics, stale total expense
- Severity if broken: critical

### Bookings

- Purpose: operational booking lifecycle with rich form and OCR assist
- Route: `/bookings`
- Entrypoints: `client/src/pages/BookingsPage.tsx`, `client/src/components/bookings/*`, `server/src/api/routes/bookingRoutes.ts`
- Primary UI surfaces: table, search, filter panel, stats cards, create/edit/view modal, delete confirm
- Primary forms/inputs: customer, amount/currency/date, package/PNR/mode/vendor, pax rows, itinerary rows, segment rows, OCR upload
- Primary actions: create, update, view, search, filter, status transitions, delete, inline customer create
- Expected outputs: correct booking record, correct travel dates/pax counts/due values, correct status change enforcement
- Persistence model: Mongo booking repo with cached wrapper
- Backend dependencies: bookings, customers, vendors, payments, OCR, audit, reports
- Access model: Owner/Admin
- Common failure modes: wrong record in modal, nested DTO mismatch, falsy update regression, status transition drift, OCR data mapping errors
- Severity if broken: critical

### OCR and files

- Purpose: extract booking data from document uploads or existing file ids; manage stored files
- Routes: no top-level page; UI enters through booking form and legacy ticket code
- Entrypoints: `client/src/components/bookings/useBookingFormV2.ts`, `client/src/components/tickets/TicketUploadManager.tsx`, `server/src/api/routes/fileRoutes.ts`, `server/src/api/routes/ocrRoutes.ts`
- Primary UI surfaces: booking OCR upload CTA, file upload flows, legacy ticket upload manager
- Primary actions: upload file, list files, view metadata, download, delete, OCR extract from upload, OCR extract from fileId, read health/schema
- Expected outputs: truthful extraction payload, optional booking-formatted payload with `format=true`, correct storage record and download behavior
- Persistence model: Mongo file repo + Google Drive or local storage fallback
- Backend dependencies: files, Google Drive service, Gemini OCR service, schema reflection
- Access model: authenticated
- Common failure modes: invalid_grant, local fallback drift, wrong mime handling, file id mismatch, OCR extraction confidence misread as correctness
- Severity if broken: critical for OCR/file workflows, medium for dormant ticket manager

### Payments

- Purpose: receivable payment capture against bookings
- Route: `/payments`
- Entrypoints: `client/src/pages/PaymentsPage.tsx`, `client/src/components/payments/*`, `server/src/api/routes/paymentRoutes.ts`
- Primary UI surfaces: table, filters/search, stats, payment modal
- Primary forms/inputs: booking selector, date, amount, payment mode, receipt number, notes
- Primary actions: create receivable, list, inspect payment
- Expected outputs: payment stored, booking paid/due updated, customer total spent updated, reports refreshed
- Persistence model: Mongo payment repo with cached wrapper
- Backend dependencies: payments, bookings, customers, accounts, reports, audit
- Access model: Owner/Admin
- Common failure modes: overpayment allowed, wrong booking linkage, duplicate submit, stale due balances
- Severity if broken: critical

### Expenses

- Purpose: vendor expense capture
- Route: `/expenses`
- Entrypoints: `client/src/pages/ExpensesPage.tsx`, `client/src/components/expenses/*`, `server/src/api/routes/paymentRoutes.ts`
- Primary UI surfaces: expense list, modal, refresh CTA
- Primary forms/inputs: vendor, amount, currency, payment mode, receipt number, category, notes
- Primary actions: create expense, list/filter
- Expected outputs: expense stored, vendor total expense updated, linked account semantics respected
- Persistence model: payment repo + vendor repo
- Backend dependencies: payments, vendors, accounts, reports, audit
- Access model: Owner/Admin
- Common failure modes: vendor without account accepted incorrectly, vendor totals stale, account direction mismatch
- Severity if broken: critical

### Refunds

- Purpose: outbound and inbound refund operations
- Route: `/refunds`
- Entrypoints: `client/src/pages/RefundsPage.tsx`, `client/src/components/refunds/*`, `server/src/api/routes/paymentRoutes.ts`
- Primary UI surfaces: refund tables/filters, create refund dialog, inbound/outbound mode handling
- Primary forms/inputs: original payment, refund date, refund mode, refund amount, reason
- Primary actions: create outbound refund, create inbound refund, list refund records
- Expected outputs: correct refund type, correct aggregate rollback, correct report freshness, no double-refund exposure
- Persistence model: payment repo + related booking/customer/vendor updates
- Backend dependencies: payments, bookings, customers, vendors, reports, audit
- Access model: Owner/Admin
- Common failure modes: wrong original payment mapping, wrong customer/vendor identity, stale paid/due totals
- Severity if broken: critical

### Reporting center and report runner

- Purpose: report catalog, shared filters, new accounting-style report runner
- Routes: `/reports`, `/reports/:reportId`
- Entrypoints: `client/src/pages/ReportsCenterPage.tsx`, `client/src/pages/ReportRunnerPage.tsx`, `client/src/components/reports/*`, `server/src/api/routes/reportRoutes.ts`
- Primary UI surfaces: catalog cards, search, filter bar, summary cards, export menu, table, print
- Primary actions: open report, apply filters, refresh, export CSV/XML, print
- Expected outputs: correct route-to-catalog mapping, truthful columns and totals, no unsupported catalog id drift
- Persistence model: report cache keys in Redis + live base repositories
- Backend dependencies: reports, bookings, payments, customers, vendors
- Access model: Owner/Admin
- Common failure modes: catalog entry not runnable, stale report cache, derived-field dishonesty, export mismatch
- Severity if broken: high to critical depending on report

### Existing customer report

- Purpose: preserved customer report direct route
- Route: `/customers/report`
- Entrypoints: `client/src/pages/CustomerReportPage.tsx`, `client/src/components/reports/CustomerReport.tsx`, backend `GET /customers/report`
- Primary actions: interval filter, pendingOnly, search, export CSV/XML, print/PDF
- Common failure modes: parity drift from prior behavior, export formatting drift, pendingOnly mismatch
- Severity if broken: critical

### Existing vendor report

- Purpose: preserved vendor report direct route
- Route: `/vendors/report`
- Entrypoints: `client/src/pages/VendorReportPage.tsx`, `client/src/components/reports/VendorReport.tsx`, backend `GET /vendors/report`
- Primary actions: interval filter, search, export CSV/XML, print/PDF
- Common failure modes: payment aggregation drift, export/print mismatch
- Severity if broken: critical

### Audit logs

- Purpose: owner-only mutation visibility and CSV export
- Route: `/logs`
- Entrypoints: `client/src/pages/AuditLogsPage.tsx`, `client/src/components/auditLogs/*`, `server/src/api/routes/auditLogRoutes.ts`
- Primary UI surfaces: table, pagination, detail modal, CSV export
- Primary actions: list, view detail, export
- Expected outputs: correct actor/entity/action/diff rendering, CSV safety when diff is empty, owner-only access
- Persistence model: Mongo audit log repo, no cached repo wrapper
- Backend dependencies: audit middleware and repositories
- Access model: Owner only
- Common failure modes: admin leakage, CSV export crash, diff parsing/rendering issues
- Severity if broken: high

### User access

- Purpose: owner-only user role and activation management
- Route: `/users`
- Entrypoints: `client/src/pages/UsersPage.tsx`, `client/src/components/users/UserManagement.tsx`, `server/src/api/routes/userRoutes.ts`
- Primary UI surfaces: member table, role select, active/inactive toggle, pagination, signed-in summary
- Primary actions: list users, change role, activate, deactivate
- Expected outputs: owner-only access, last-owner protections, no self-deactivation from UI path
- Persistence model: Mongo user repo with cached wrapper
- Backend dependencies: users, auth, audit
- Access model: Owner only except `/users/me`
- Common failure modes: admin access drift, last-owner protection failure, stale table after mutation
- Severity if broken: critical

### Platform-only modules

- Maintenance banner: `client/src/components/ui/MaintenanceBanner.tsx`
- Unsupported device gate: `client/src/components/ui/UnsupportedDevice.tsx`
- Session expired modal: `client/src/components/ui/common/SessionExpiredModal.tsx`
- Metrics endpoints: `server/src/api/routes/metricsRoutes.ts`

Severity if broken:
- maintenance/mobile/session: high
- metrics: medium operational, high security if public

### Legacy and dormant surfaces

- Runtime boundary route: `client/src/pages/LegacySurfacePage.tsx`
- Dormant components: dashboard, ledgers, calendar, settings, tickets
- Special caution: `client/src/components/tickets/TicketUploadManager.tsx` still references Firebase and external OCR service and is not representative of active production flows
- Severity if broken: medium for runtime boundary, lower for dormant-only UI unless it pollutes build or active workflows

## 15. File-By-File And Component-By-Component Audit Protocol

For each file inspected, document:
- purpose
- dependencies
- props or inputs
- state dependencies
- side effects
- network dependencies
- persistence touchpoints
- access implications
- likely failure classes
- testing implications

### Mandatory frontend file groups

#### App entry and routing
- `client/src/main.tsx`
- `client/src/App.tsx`
- `client/src/routes/routeConfig.tsx`
- `client/src/routes/PrivateRoute.tsx`
- `client/src/routes/PublicRoute.tsx`

#### Shell and platform
- `client/src/components/ui/Layout.tsx`
- `client/src/components/ui/MaintenanceBanner.tsx`
- `client/src/components/ui/UnsupportedDevice.tsx`
- `client/src/components/ui/common/SessionExpiredModal.tsx`
- `client/src/design-system/shell/Breadcrumbs.tsx`
- `client/src/design-system/shell/CommandPalette.tsx`
- `client/src/design-system/shell/QuickActions.tsx`

#### Page entrypoints
- every file in `client/src/pages/`

#### Major active module components
- `client/src/components/customers/*`
- `client/src/components/vendors/*`
- `client/src/components/bookings/*`
- `client/src/components/payments/*`
- `client/src/components/expenses/*`
- `client/src/components/refunds/*`
- `client/src/components/reports/*`
- `client/src/components/auditLogs/*`
- `client/src/components/users/*`

#### Shared state, services, and types
- `client/src/contexts/AppContext.tsx`
- `client/src/utils/apiConnector.ts`
- `client/src/utils/roleAccess.ts`
- `client/src/utils/toasts.ts`
- `client/src/types/index.ts`
- `client/src/services/auditLogService.ts`
- `client/src/services/userService.ts`

#### Dormant but important
- `client/src/components/dashboard/*`
- `client/src/components/ledgers/*`
- `client/src/components/calendar/*`
- `client/src/components/settings/*`
- `client/src/components/tickets/*`
- `client/src/firebaseconfig.ts`

### Mandatory backend file groups

#### Bootstrap and config
- `server/src/index.ts`
- `server/src/server.ts`
- `server/src/config/container.ts`
- `server/src/config/mongodb.ts`
- `server/src/config/redis.ts`

#### Route and controller layer
- all files in `server/src/api/routes/`
- all files in `server/src/api/controllers/`

#### Middleware
- `server/src/middleware/requireAuth.ts`
- `server/src/middleware/auditLogger.ts`
- `server/src/middleware/errorHandler.ts`
- `server/src/middleware/dateParser.ts`
- `server/src/middleware/dateSerializer.ts`

#### Domain and model layer
- `server/src/models/FirestoreTypes.ts`
- `server/src/domain/Customer.ts`
- `server/src/domain/Vendor.ts`
- `server/src/domain/Booking.ts`
- `server/src/domain/Payment.ts`
- `server/src/domain/User.ts`

#### Use cases and repositories
- `server/src/application/useCases/customer/*`
- `server/src/application/useCases/vendor/*`
- `server/src/application/useCases/booking/*`
- `server/src/application/useCases/payment/*`
- `server/src/application/useCases/reporting/*`
- `server/src/application/useCases/file/*`
- `server/src/application/useCases/user/*`
- `server/src/application/useCases/auditLog/*`
- `server/src/infrastructure/repositories/mongodb/*`

#### External services
- `server/src/infrastructure/services/JwtService.ts`
- `server/src/infrastructure/services/GoogleOidcService.ts`
- `server/src/infrastructure/services/GoogleDriveService.ts`
- `server/src/infrastructure/services/RedisService.ts`
- `server/src/services/GeminiOCRService.ts`
- `server/src/services/SchemaReflectionService.ts`

#### Docs and smoke assets
- `features.md`
- `reporting-features.md`
- `docs/revamp/*`
- `scripts/smoke/revamp-smoke.sh`

### Test inventory reality

Current repo test reality is limited:
- `client/package.json` exposes `npm run test` = lint + typecheck
- `server/package.json` exposes `npm run test` = jest `--passWithNoTests`
- `server/test/` currently contains only a client fixture folder, not meaningful server coverage

Therefore future auditors must rely heavily on:
- build/typecheck gates
- smoke script
- API probes
- browser automation
- manual scenario evidence

## 16. Automated Audit Sub-Plan

Use a combination of build checks, route discovery, API probes, and browser automation.

### Baseline commands

Frontend:
```bash
cd client
npm run test
npm run build
```

Backend:
```bash
cd server
npm run typecheck
npm run test
npm run build
```

Smoke:
```bash
./scripts/smoke/revamp-smoke.sh http://localhost:3000 http://localhost:5173
```

Optional authenticated smoke:
```bash
AUTH_TOKEN="<jwt>" OWNER_TOKEN="<owner-jwt>" ./scripts/smoke/revamp-smoke.sh http://localhost:3000 http://localhost:5173
```

### Route discovery

Use code discovery, not guesswork:
```bash
rg -n "path:" client/src/routes client/src/App.tsx -S
rg -n "app\\.(get|post|put|patch|delete)" server/src/api/routes -S
```

### Browser automation expectations

Use Playwright or Codex browser tools to:
- visit every routed screen
- capture console errors
- capture failed network requests
- exercise critical CTAs
- validate modal open/close flows
- verify direct URL denial and redirect behavior
- capture screenshots for every defect

### Console and network capture

Every automated UI run must collect:
- console errors/warnings
- failed network requests
- auth failures
- 4xx/5xx responses
- CORS or cookie issues

### Scenario ID rules

Use stable IDs:
- `B02-AUTH-001`
- `B04-CUST-003`
- `B06-BOOK-011`
- `B13-REPT-007`

Scenario ID format:
- batch id
- module short code
- three-digit sequence

### Artifact naming rules

Store artifacts outside the repo, for example under `/tmp`:
- `/tmp/travox-qa/<YYYYMMDD>/<batch-id>/<scenario-id>--screenshot.png`
- `/tmp/travox-qa/<YYYYMMDD>/<batch-id>/<scenario-id>--console.txt`
- `/tmp/travox-qa/<YYYYMMDD>/<batch-id>/<scenario-id>--network.json`
- `/tmp/travox-qa/<YYYYMMDD>/<batch-id>/<scenario-id>--api.json`

### Evidence packaging rules

Each automated batch must output:
- executed scenario list
- pass/fail/blocked table
- artifact paths
- defects found
- skipped scenarios
- explicit next-step recommendation

## 17. Manual QA Sub-Plan

Use this format for manual QA rows.

| Scenario ID | Persona | Route / Screen | Workflow | Expected | Actual | Status | Evidence |
|---|---|---|---|---|---|---|---|

### Manual QA domains that must be covered

- auth and session
- customers
- vendors
- bookings
- OCR and files
- payments
- expenses
- refunds
- reporting center
- existing customer report
- existing vendor report
- audit logs
- user access
- shell/navigation/platform gates
- legacy boundaries
- responsive/zoom/accessibility basics

### Required manual probes

- zoomed sidebar scroll behavior
- quick action behavior when already on the target route
- command palette close/open and navigation
- modal close via overlay, button, and keyboard when supported
- table pagination + row action integrity
- print dialog generation for reports
- export download trigger behavior
- session-expired modal surfacing after forced auth failure

## 18. Release Smoke Sub-Plan

This is the minimum fast smoke required for a release decision.

### Minimum critical flows

1. Backend boots and `/health` returns OK.
2. Frontend boots and `/` loads.
3. Google login or equivalent authenticated session works.
4. Protected route access works for Owner on:
   - `/customers`
   - `/vendors`
   - `/bookings`
   - `/payments`
   - `/expenses`
   - `/refunds`
   - `/reports`
   - `/customers/report`
   - `/vendors/report`
   - `/logs`
   - `/users`
5. Admin is denied from `/logs` and `/users`.
6. Customer create/edit/delete/search works.
7. Vendor create/edit/delete/search works.
8. Booking create/edit/search/filter/status transition works.
9. Receivable payment creation works and overpayment is blocked.
10. Expense creation works.
11. Outbound and inbound refund flows work.
12. Reporting center loads and at least one new report plus both existing reports load.
13. Export or print works for at least one report.
14. Audit log export works.
15. File upload + OCR works if integration env is configured, or is explicitly blocked by env with truthful errors.

### Immediate no-go conditions

- auth unusable
- protected data publicly accessible
- Owner/Admin role drift on protected modules
- booking creation or update broken
- receivable payment broken or overpayment allowed
- refund flow broken or corrupting aggregates
- report routes broken or exports broken
- audit log export broken
- cross-org leakage detected
- build/typecheck failing on touched production paths

### Conditional-go conditions

Conditional-go only if:
- failures are confined to dormant legacy code not reachable from active product surfaces
- or failures are clearly environment-only and non-production-path with explicit mitigation

### Required release decision outputs

- completed smoke checklist
- blocker list
- deferred-risk list
- exact rationale for go / no-go / conditional-go

## 19. Defect Logging Contract

Every defect must be logged with this exact structure.

| Field | Required content |
|---|---|
| Defect ID | Stable ID such as `DEF-B06-004` |
| Severity | P0, P1, P2, P3 |
| Module | Customers, Vendors, Bookings, Reports, etc. |
| Route / Screen | Exact route or endpoint |
| Persona affected | Unauth, Admin, Owner, cross-org, expired-session |
| Repro steps | Ordered steps |
| Expected | Exact expected behavior |
| Actual | Exact observed behavior |
| Evidence | Screenshot, console log, API payload, artifact path |
| Suspected root cause | Code-backed hypothesis only |
| Likely files/modules | Exact paths if possible |
| Confidence | High, Medium, Low |

Severity guidance:
- P0: security/data leak/release stop
- P1: critical workflow broken
- P2: important but non-blocking regression
- P3: polish, dormant legacy issue, or secondary UX issue

## 20. Retest And Regression Planning

For every blocker or high-severity issue:
- define exact retest steps
- name adjacent surfaces that may regress
- specify the minimum post-fix smoke suite

### Required retest structure

| Defect ID | Retest steps | Adjacent regressions to check | Post-fix smoke set | Status |
|---|---|---|---|---|

### Mandatory adjacent regression examples

- auth fix -> retest refresh, logout, direct URL guard, role-gated routes
- customer fix -> retest account link, booking history modal, report inclusion
- vendor fix -> retest expense flow, vendor report, linked account
- booking fix -> retest payments, refunds, reports, OCR prefill
- payment/refund fix -> retest booking due/paid values, customer totals, vendor totals, reports
- reporting fix -> retest exports, print, catalog route, filters, existing direct report routes
- user/audit fix -> retest owner/admin gating, export, current-user behavior
- file/OCR fix -> retest upload, download, delete, `/scan`, `/schema`, booking prefill

### Safe-to-defer list rules

An issue can be marked safe to defer only if:
- it does not affect active critical workflows
- it does not create security, data-integrity, or release-confidence risk
- it is not in an owner/admin access path
- it is not in report/export correctness
- it is explicitly documented as deferred

### Release-risk summary

End every major audit cycle with:
- blocker count
- unresolved P1 count
- unresolved P2 count
- skipped critical batches
- environment blockers
- final confidence statement

## 21. Quality Bar

This file must be used like:
- a production audit operations manual
- a release-readiness testing playbook
- a Codex-usable multi-session guide

It must not be used like:
- a shallow generic QA prompt
- a casual checklist
- a route-only smoke list

## Project-Specific Notes And Caveats

### Current stack truths

- React Router drives frontend routing.
- Module access is role-based via `canAccessModule`.
- `useApp()` is not a true data store for active runtime features; active modules mostly fetch directly from APIs.
- `reports` route is guarded using the `"customers"` module key on the frontend, so reporting access must still be checked explicitly.
- Server-side access is enforced by `requireAuth`.
- Redis-backed cached repositories mean stale data testing is mandatory after mutations.
- Report cache keys use `report:center:<orgId>:...`.
- File storage may fall back to local storage if Google Drive is unavailable or configured off.
- OCR is externally dependent on Gemini and must be evaluated separately from core booking logic.

### Known documentation drift risk

The following docs contain legacy or partially stale language and must not override code truth:
- `client/README.md` still describes Firebase-era architecture
- `server/README.md` references older role language and repository names

### Legacy/dormant contamination risk

These areas are still important even if not primary runtime modules:
- `client/src/components/tickets/TicketUploadManager.tsx` still uses Firebase and a separate external OCR endpoint
- dashboard/ledger/calendar/settings components can leave no-op CTAs or stale dependency imports in the codebase

### External environment prerequisites for meaningful audit

At minimum:
- backend envs for JWT and MongoDB
- frontend env for `VITE_API_BASE`
- Google login envs and allowed origins for real auth
- Redis if cache/freshness is being audited fully
- Gemini API key for OCR
- Google Drive credentials or explicit local storage configuration for file flows

If an environment dependency is absent:
- label blocked scenarios as environment-blocked
- still test graceful failure messaging
- do not mark the business flow as passed

## Final Output Contract For Future Audit Runs

Every future run that uses this manual must end with:
- batches executed
- batches skipped
- scenario counts
- findings table
- defect log
- retest list
- artifact paths
- release confidence statement

If the run is partial, state:
- "This is not a release verdict."

