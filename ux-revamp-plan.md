Travox UX Revamp Master Plan v2
Functionality-Preserving, End-to-End, Single Coordinated Release
ABSOLUTE RULE: Every current functionality must remain intact end to end. No workflow loss, no permission drift, no API contract drift, no hidden regression.

You are working on the Travox repository and must execute a full frontend UX revamp with a new design system and modernized information architecture, while preserving all current business behavior and all currently available user outcomes.

This is NOT a greenfield redesign.
This is NOT a cosmetic-only pass.
This is a functionality-preserving product rebuild of the frontend experience, with a small set of required compatibility fixes where the current codebase already contains known parity-breaking issues.

==================================================

1. PRIMARY OBJECTIVE
   ==================================================

Deliver a complete UX revamp of Travox in one coordinated release branch, covering:

A) Active routed modules:

- Customers
- Customer Report
- Vendors
- Vendor Report
- Bookings
- Payments
- Expenses
- Refunds
- Audit Logs
- User Access

B) Legacy/non-routed surfaces that still exist in the repo:

- Dashboard
- Ledgers
- Calendar
- Settings
- Tickets

The revamp must:

- preserve current backend semantics by default
- preserve current role/access behavior
- preserve current auth/session behavior
- preserve current status transition rules
- preserve current exports and reports behavior
- preserve current file/OCR capabilities
- preserve current org-scoped multi-tenant data behavior
- preserve current masking/unmasking behavior
- preserve current caching side-effect behavior where user outcomes depend on it
- preserve current desktop-first stance while improving usability and consistency
- preserve current mobile unsupported/continue-anyway behavior unless explicitly restyled
- preserve current maintenance banner behavior
- preserve current session-expired behavior
- preserve current hidden dark-mode unlock behavior unless explicitly reimplemented

Success means:

- much better UX
- zero functional regressions
- zero permission regressions
- zero contract regressions
- zero broken workflows

==================================================
2. NON-NEGOTIABLE CONSTRAINTS
=============================

1. Do not remove any active capability.
2. Do not silently change any backend contract.
3. Do not change role permissions.
4. Do not change route semantics unless redirects/deep-link preservation are implemented.
5. Do not change business outcomes of create/edit/delete/report/export/payment/refund/audit flows.
6. Do not expose currently hidden backend/controller capabilities to end users unless explicitly required and parity-validated.
7. Do not delete legacy modules just to make the revamp easier.
8. Do not leave any migrated surface half-modernized.
9. Do not break existing filters, exports, status transitions, OCR prefills, linked account flows, or audit visibility rules.
10. Any code cleanup must be behavior-safe and covered by tests.

==================================================
3. CURRENT PRODUCT CONTRACT TO PRESERVE
=======================================

Preserve the following current product model exactly unless a listed compatibility fix requires otherwise:

AUTH + SESSION

- Google-only login flow
- POST /auth/google initiation pattern
- refresh-token-based session recovery
- session-expired handling and forced re-login path
- current route guards and module guards

ROLES + ACCESS

- Roles remain Owner and Admin
- Owner retains access to all modules
- Admin retains access to all except Audit Logs and User Access
- Endpoint access behavior must remain aligned with this model

ACTIVE MODULES TO PRESERVE

- /customers
- /customers/report
- /vendors
- /vendors/report
- /bookings
- /payments
- /expenses
- /refunds
- /logs
- /users

CUSTOMER WORKFLOWS

- create/list/search/update/delete
- placeholder account creation behavior
- stats/account/booking-linked views
- CSV import with partial-success reporting

VENDOR WORKFLOWS

- create/list/search/update/delete
- required service type logic
- duplicate checks
- stats and vendor reporting
- account-linking behavior for payout workflows

BOOKING WORKFLOWS

- create/edit/view modes
- inline customer creation
- vendor linking
- OCR prefill from uploaded image/pdf/file
- nested itinerary/segment behavior
- current required field rules
- current status transition rules
- search/filter/stats
- soft delete and archive semantics that currently exist
- do not accidentally expose hidden booking controller capabilities unless explicitly approved

FINANCIAL WORKFLOWS

- receivable payments
- expenses
- outbound refunds
- inbound refunds
- all linked side effects on booking/customer/vendor aggregates
- overpayment prevention
- linked account semantics
- report cache invalidation side effects

REPORTING + EXPORTS

- customer report behavior
- vendor report behavior
- interval filters
- pendingOnly behavior
- CSV export
- Excel-compatible XML export
- print/PDF window behavior

USER ACCESS + AUDIT

- list users
- role change
- activate/deactivate with last-owner protection
- audit list/filter/export/detail behavior
- audit generation only for mutating operations unless existing code says otherwise

FILES + OCR

- file upload/list/get/update/delete/download
- ticket-kind file linking behavior
- OCR upload/existing-file extraction behavior
- /scan health behavior
- schema endpoint behavior

DATA + PLATFORM RULES

- organization scoping
- masking of sensitive fields
- ?unmask=true handling where supported
- IST-oriented date behavior unless explicitly normalized without changing user-visible meaning
- current maintenance banner env behavior
- mobile unsupported gate with continue-anyway override
- hidden dark mode unlock behavior

==================================================
4. REQUIRED COMPATIBILITY FIXES
===============================

These are allowed and required because they fix known current inconsistencies or risks that can break parity confidence:

1. Secure metrics endpoints

- Protect GET /metrics and POST /metrics/reset with auth and appropriate role checks
- Do not remove the endpoints
- Preserve operational utility while eliminating unauthenticated exposure

2. Fix inbound refund identity mapping

- Correct the vendorId/customerId mapping issue in inbound refund creation
- Add regression coverage proving vendor-linked analytics/reporting now remain correct

3. Normalize PaymentMode contract

- Resolve frontend/backend drift around PaymentMode.OTHER
- Choose one canonical contract and make client + server + DTOs + forms + validation + export formatting consistent
- Do not leave any ambiguous runtime mapping

4. Fix booking update falsy-value semantics

- Replace || fallback update semantics with explicit undefined checks
- Ensure valid falsy updates such as 0 or empty string behave intentionally and safely

5. Resolve broken bootstrap-owner script reference

- Either implement the missing script safely or remove the broken script entry if it is truly unused
- Do not leave broken operational scripts in package.json

6. Legacy Firebase ticket/settings handling

- Do not leave broken Firebase imports and broken type paths contaminating the build graph
- Either:
  A) fully rehabilitate these flows onto supported dependencies/current architecture, or
  B) isolate them behind a clearly marked legacy boundary so they no longer break type/lint/build confidence
- Preserve code and intended capability footprint; do not casually delete

7. Type/lint debt containment

- At minimum, active routed modules and any touched legacy modules must pass build, lint, and typecheck cleanly
- Do not ship a revamp that worsens repo confidence

==================================================
5. INFORMATION ARCHITECTURE DIRECTION
=====================================

Use a HYBRID IA, not a pure abstract task-only IA.

Reason:
Travox is an operations product. Users think in domain objects such as customers, vendors, bookings, payments, expenses, refunds, reports, users, and logs. A pure “workspace” abstraction will increase lookup friction.

Implement:

- task-friendly grouping in navigation
- but keep domain nouns explicit in labels, routes, headings, breadcrumbs, and page titles

Recommended top-level nav grouping:

- Operations
  - Customers
  - Vendors
  - Bookings
- Finance
  - Payments
  - Expenses
  - Refunds
  - Ledgers (if retained in usable form)
- Reporting
  - Customer Report
  - Vendor Report
  - Dashboard (if retained and modernized)
- Administration
  - Audit Logs
  - User Access
  - Settings
- Utilities
  - Calendar
  - Tickets / OCR / Files if this becomes a dedicated workspace

Rules:

- preserve direct links to existing routes
- preserve deep-link compatibility
- preserve role-aware visibility
- add breadcrumbs everywhere
- add global quick actions
- add global search / command entry for high-frequency objects

==================================================
6. DESIGN SYSTEM FOUNDATION
===========================

Build a reusable design system layer first, then migrate modules onto it.

Base brand direction:

- primary color anchored around #3730A3 unless the existing visual language requires tokenized derivation
- desktop-first
- crisp, high-density B2B operations UI
- clean spacing rhythm
- modern but not gimmicky

Create tokenized foundations for:

- color
- typography
- spacing
- radius
- shadow/elevation
- border system
- z-index/layering
- motion
- focus states
- status semantics
- light/dark parity if dark mode exists or is hidden-unlocked

Core components:

- app shell
- nav
- top bar
- breadcrumbs
- command palette / search surface
- buttons
- text inputs
- selects
- autocomplete
- date controls
- money inputs
- segmented controls
- tabs
- badges
- chips
- tables / data grids
- pagination
- cards
- drawers
- modals
- toasts
- inline validation blocks
- loading / empty / error states
- detail panels
- stats widgets
- export menus
- filter bars
- confirmation patterns
- destructive action patterns

Interaction rules:

- consistent validation placement
- no random toast-only validation for critical forms
- explicit async/loading states
- explicit optimistic vs pessimistic update rules
- keyboard support
- visible focus states
- sane mobile fallback behavior

==================================================
7. MODULE MIGRATION STRATEGY
============================

Perform migration in this order:

PHASE 0: BASELINE DISCOVERY + LOCK

- inspect current route map
- inspect current DTOs, enums, API services, guards, forms, tables, exports
- create a parity matrix for every active module and every legacy module
- create request/response snapshots for all critical flows
- document role matrix
- document hidden/non-routed capabilities and keep them hidden unless approved
- document current env-driven behaviors
- document current export behaviors
- document current mobile warning and session-expired flows

PHASE 1: DESIGN SYSTEM + APP SHELL

- implement new shell, top bar, left nav, breadcrumbs, page header model, quick actions, global search entry
- wire shell without breaking route behavior
- keep old module content operational inside the new shell first
- do not start rewriting business logic yet

PHASE 2: ACTIVE MODULES
Migrate one by one:

1. Customers
2. Vendors
3. Bookings
4. Payments
5. Expenses
6. Refunds
7. Customer Report
8. Vendor Report
9. Audit Logs
10. User Access

For each module:

- preserve route
- preserve data source
- preserve filters and sorting
- preserve pagination behavior
- preserve table semantics
- preserve exports
- preserve mutations
- preserve role restrictions
- preserve linked navigation
- preserve all current empty/error/loading states unless replaced with functionally equivalent better states
- add regression tests before and after migration if missing

PHASE 3: LEGACY SURFACES
Treat each legacy surface explicitly:

DASHBOARD

- keep if it has meaningful data and can be modernized safely
- if it is mostly placeholder/mock-driven, convert only when backed by real API data or retain as a non-primary legacy/internal surface

LEDGERS

- if retained, make them consistent with finance IA and current APIs
- do not ship ledger UX that still depends on placeholder arrays

CALENDAR

- retain only if current code supports meaningful operational behavior
- otherwise keep as legacy/internal until properly backed

SETTINGS

- preserve real settings functionality
- do not leave broken Firebase-era settings paths active

TICKETS

- preserve intended ticket/file/OCR capability footprint
- if legacy Firebase flow is stale, move toward current file/OCR architecture rather than leaving dual broken paths

Rule for legacy modules:

- no random deletion
- no fake modernization over mock data
- no broken routes
- no silent abandonment

PHASE 4: PLATFORM POLISH

- refine cross-module search
- unify filter and export ergonomics
- unify row/detail drilldown patterns
- unify entity create/edit/detail patterns
- ensure consistency of status badges, amounts, timestamps, and user actions

==================================================
8. UX REQUIREMENTS BY DOMAIN
============================

AUTH

- clearer loading, retry, and session-expiry states
- no auth flow behavior change

CUSTOMERS / VENDORS

- reduce cognitive load
- improve create/edit forms
- improve list filters and detail drilldowns
- preserve import/report/stats/linkages

BOOKINGS

- this is the highest-complexity UX
- preserve all create/edit/view and OCR-prefill behavior
- use progressive disclosure for sections
- make amount/state/vendor/PAX/segment logic much clearer
- preserve all current status logic exactly

FINANCE

- unify payments/expenses/refunds into a coherent form language
- preserve endpoint semantics and side effects exactly
- make transaction history and linkage clearer
- preserve amount validation and overpayment prevention

REPORTS

- make date filters, pending-only logic, export entry points, and summary/detail relationships clearer
- preserve exported content structure and data correctness

AUDIT / USER ACCESS

- preserve owner/admin visibility and restrictions exactly
- improve high-density admin ergonomics without changing powers

FILES / OCR

- preserve upload/list/download/delete flows
- preserve OCR extraction and prefill flows
- make file state, progress, and parsing outcomes clearer

==================================================
9. ENGINEERING SAFETY GATES
===========================

Before final merge, all of the following must be true:

A) Functional parity

- every previously available active user action still works
- every current report/export still works
- every role restriction still works
- every critical cross-module linkage still works
- no current route becomes a dead end
- no current deep link breaks without redirect support

B) Contract parity

- same endpoint semantics unless a listed compatibility fix requires change
- same DTO meanings
- same enum meanings
- same status transition rules
- same masking/unmask behavior
- same auth refresh behavior
- same organization scoping behavior

C) Financial correctness

- booking paid/due values remain correct
- customer spend remains correct
- vendor expense remains correct
- outbound refund effects remain correct
- inbound refund effects remain correct
- report totals remain correct
- cache invalidation still occurs where business views depend on fresh aggregates

D) Platform correctness

- session-expired modal still works
- maintenance banner env control still works
- mobile unsupported continue-anyway flow still works unless intentionally redesigned
- hidden dark-mode unlock still works if retained
- Swagger/docs/health endpoints remain unaffected
- Google Drive and OCR integrations still work end to end

E) Repo confidence

- client build passes
- server build passes
- active paths pass lint and typecheck
- any touched legacy surfaces pass lint and typecheck
- new tests pass
- no broken scripts remain in package.json

==================================================
10. TEST PLAN
=============

Add or strengthen automated coverage for:

AUTH

- login success
- refresh success
- refresh failure -> session-expired UX
- role-based route guards

CUSTOMERS

- create
- update
- delete
- search/filter
- stats/detail
- CSV import
- account linkage visibility

VENDORS

- create
- update
- delete
- search/filter
- duplicate validation
- stats/report linkage

BOOKINGS

- create
- edit
- view
- inline customer create
- vendor link
- OCR prefill
- status transitions
- search/filter
- soft delete/archive behaviors that are currently exposed
- falsy update behavior regression

FINANCE

- receivable create
- overpayment prevention
- expense create
- outbound refund
- inbound refund
- customer/vendor/booking aggregate effects
- report invalidation/freshness behaviors where observable

REPORTS

- customer report filters
- vendor report filters
- pendingOnly logic
- CSV/XML/print outputs

USERS + AUDIT

- role change
- activate/deactivate
- last-owner protection
- audit listing/filter/export/detail
- owner/admin visibility restrictions

FILES + OCR

- file upload/list/download/delete
- OCR extraction from upload
- OCR extraction from file id
- booking prefill pipeline

SECURITY / OPS

- metrics auth protection
- user scoping
- unmask behavior
- health/docs availability
- no unauthorized access to owner-only surfaces

RESPONSIVE / ACCESSIBILITY

- desktop is primary
- tablet/mobile should not be broken
- if mobile remains unsupported-first, that UX must still behave correctly
- keyboard navigation
- focus order
- contrast
- field error announcements

==================================================
11. RELEASE STRATEGY
====================

This is one coordinated release, but do NOT implement it as one reckless blob.

Use:

- one long-lived integration branch
- module-by-module migration behind that branch
- parity checklist per module
- frequent smoke checks
- final merge only when all parity gates pass

Do not rely on subjective “looks better” review.
The release is blocked until functional parity is proven.

==================================================
12. REQUIRED DELIVERABLES
=========================

Produce all of the following:

1. A concise architecture note explaining:

- old IA
- new IA
- why hybrid IA was used
- what routes were preserved
- how legacy modules were handled

2. A parity matrix document listing for every module:

- route
- role access
- list/detail/create/edit/delete actions
- filters
- exports
- related entities
- preserved business rules
- tests covering it

3. A design system package/folder with documented primitives and tokens
4. A migration log showing:

- what changed visually
- what did not change behaviorally
- what compatibility fixes were applied
- where legacy boundaries remain

5. Automated tests and smoke scripts covering critical workflows

==================================================
13. EXECUTION STYLE
===================

Be conservative with business logic.
Be aggressive with UX quality.
Do not invent new product scope.
Do not silently remove edge-case behavior.
When uncertain, prefer preserving current behavior over “improving” it.
When current behavior is already broken or risky, fix it only if the fix is explicitly listed above or required to preserve correctness.

==================================================
14. FINAL ACCEPTANCE CRITERIA
=============================

The work is complete only when:

- Travox looks substantially more modern and coherent
- all current end-to-end workflows remain intact
- no active capability is lost
- no role/access behavior changes
- no report/export behavior breaks
- no auth/session behavior breaks
- no payment/refund/booking correctness regressions exist
- known parity-risk defects are fixed
- active modules are stable under build/lint/typecheck/tests
- legacy surfaces are either safely modernized or safely isolated without functionality loss

Start by generating:

1. a repo-informed parity matrix,
2. the new IA proposal,
3. the design system structure,
4. the migration sequence,
5. the exact implementation plan by module,
   and then proceed to implementation.
