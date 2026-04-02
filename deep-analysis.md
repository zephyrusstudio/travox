# Travox Deep Codebase Analysis

Last analyzed: March 28, 2026
Scope: Full `client/src` + `server/src`, route/workflow tracing, build/lint/type checks

## 1. Analysis Method

- Scanned repository inventory (`client/src`: 97 files, `server/src`: 151 files, total: 248 files).
- Traced active frontend routes, backend route registration, and endpoint protection.
- Cross-checked frontend DTO/enums against backend models/use-cases.
- Validated build/type/lint/test health:
  - `client`: `npm run build` passed
  - `server`: `npm run build` passed
  - `client`: `npm run lint` failed (59 errors, 1 warning)
  - `server`: `npm test` intentionally fails (`No test specified`)
  - `client`: `tsc -b client` failed with large type debt in legacy modules (dashboard/ledgers/calendar/settings/tickets)

## 2. Current Functional Surface

### 2.1 Actively Routed Product Surface

Frontend route config confirms active modules:

- `/customers`
- `/customers/report`
- `/vendors`
- `/vendors/report`
- `/bookings`
- `/payments`
- `/expenses`
- `/refunds`
- `/logs`
- `/users`

### 2.2 Backend Route Surface

Backend route registration includes:

- Auth (`/auth/google`, `/auth/logout`, `/auth/refresh`)
- Customer, vendor, booking, payment, user, audit, account, file, OCR, metrics APIs

### 2.3 Legacy/Non-routed Frontend Surface

There is substantial legacy code not connected to active routing:

- `dashboard/*`
- `ledgers/*`
- `calendar/*`
- `settings/*`
- `tickets/*`

This is confirmed by import tracing and by strict typecheck/lint failures concentrated in these modules.

## 3. Severity-Ranked Findings

## P0/P1 (High Risk)

1. Public metrics endpoints without auth
- `GET /metrics` and `POST /metrics/reset` are exposed without `requireAuth`.
- Risk: operational metadata leakage and unauthorized metrics reset.

2. Payment identity inconsistency in inbound refund domain mapping
- `Payment.createInboundRefund(...)` stores `vendorId` into `customerId` and leaves `vendorId` unset in constructor placement.
- This can cause query/report mismatches for inbound refund records and vendor-linked analytics paths.

3. Missing script target referenced by package scripts
- `server/package.json` includes `bootstrap-owner`: `ts-node src/scripts/bootstrapOwnerUser.ts`.
- File does not exist in `server/src/scripts` (only `flushRedisCache.ts` exists).
- Risk: broken operational onboarding/bootstrap workflow.

4. Legacy Firebase ticket/settings stack is broken and stale but still in tree
- `client/src/components/tickets/TicketUploadManager.tsx` imports `firebase/firestore`.
- `client/src/firebaseconfig.ts` imports Firebase SDK and contains hardcoded Firebase project config.
- `client` package does not declare Firebase dependency.
- `tsc -b client` fails on missing Firebase modules and multiple undefined symbols in ticket/settings legacy paths.
- Risk: accidental reuse of broken path, confusion, and potential secret-management hygiene issues.

## P2 (Medium Risk)

5. Enum contract drift: frontend has `PaymentMode.OTHER`, backend enum does not
- Frontend expense/refund helpers map to/from `OTHER`.
- Backend `PaymentMode` enum does not include `OTHER`.
- Risk: request rejection or normalization ambiguity when `OTHER` is selected.

6. Booking update uses `||` fallback semantics (cannot intentionally set falsy values)
- In `UpdateBooking`, fields are updated with `data.x || existing`.
- This prevents intentional updates like empty string and `advanceAmount = 0`.
- Risk: silent update behavior mismatch.

7. Route/controller capability mismatch in booking module
- Controller supports methods such as `getByCustomerId`, `updatePayment`, `archive`, but corresponding route lines are commented.
- Risk: hidden/dead API capabilities and confusion for frontend/backend contract evolution.

8. Date middleware encodes hard IST assumption globally
- `dateParserMiddleware` and `dateSerializerMiddleware` apply fixed IST offset to all recognized date strings.
- Code/comments still describe Firestore even though backend uses MongoDB.
- Risk: timezone behavior surprises for non-IST users/environments and documentation drift.

9. Token strategy is mixed (httpOnly cookie + local/session storage access token)
- Access token is returned in response body and persisted in browser storage, while cookie is also used.
- Risk: larger XSS blast radius versus cookie-only access token pattern.

## P3 (Maintainability / Structural Debt)

10. Large inactive code footprint with strict-type and lint debt
- `client` lint fails primarily in non-routed modules.
- `tsc -b client` fails with extensive `never/any/implicit any/missing symbol` issues in legacy modules.
- This reduces confidence when enabling strict checks or reviving old modules.

11. High use of `any` and weakly typed controller error handling
- Broad use of `any` across API controllers, middleware, OCR/schema services, and frontend data transforms.
- Slows refactors and increases runtime-only failure discovery.

12. Terminology drift across codebase
- `FirestoreTypes.ts` still names canonical enums/interfaces despite MongoDB backing.
- Some comments and utilities still reference Firestore-specific behavior.
- Increases onboarding and maintenance friction.

## 4. Workflow Integrity (End-to-End)

### 4.1 Strong Workflows (Operationally coherent)

- Google login + refresh token rotation + role-based guards.
- Customer/vendor CRUD + reports.
- Booking create/search/filter/stats + OCR assisted prefill (`/scan?format=true`).
- Receivable/expense/refund write paths with repository cache invalidation hooks.

### 4.2 Partial/Fragile Workflows

- Metrics operations are not protected.
- Booking auxiliary methods exist but are not routed.
- Legacy ticket/settings workflows are non-functional under strict type/tooling and disconnected from primary API architecture.

## 5. Validation Snapshot

- Build status suggests active routed paths are stable enough for production bundles.
- Lint/type status indicates the repo is not clean at whole-project strictness level.
- No automated backend test suite currently exists (`npm test` is placeholder exit 1).

## 6. Recommended Remediation Order

1. Secure metrics endpoints with auth + role checks (Owner/Admin as needed).
2. Fix inbound refund payment field mapping (`vendorId` vs `customerId`) and add regression tests around refund reports/queries.
3. Resolve or remove broken `bootstrap-owner` script entry.
4. Decide fate of legacy frontend modules:
   - either remove/archive them from build graph, or
   - fully restore with type-safe contracts and dependencies.
5. Normalize payment mode contract across client/server (`OTHER` decision).
6. Replace `||` update semantics in booking update with explicit undefined checks.
7. Add baseline backend tests for payments/refunds/booking transitions and route auth.
8. Unify timezone strategy and update stale Firestore-oriented comments/naming.

## 7. Strategic Recommendation

The active Travox core (customers/vendors/bookings/payments/refunds/reports/auth) is structurally sound enough to iterate on. The biggest risk now is not core feature absence; it is contract drift and legacy surface debt. Prioritizing security + contract fixes first, then pruning or rehabilitating legacy modules, will give the fastest reliability gain.
