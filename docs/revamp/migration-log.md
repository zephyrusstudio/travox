# Travox Revamp Migration Log

## Visual/UX Changes
- Introduced grouped hybrid IA in sidebar (Operations, Finance, Reporting, Administration, Utilities).
- Added shell-level breadcrumbs and standardized page headers.
- Added shell quick actions for high-frequency workflows.
- Added command palette (`Ctrl/Cmd + K`) for cross-module navigation.
- Applied tokenized primary color system centered on `#3730A3`.
- Updated branding assets and logo light/dark switching in shell and auth.
- Added reusable design-system patterns for module headers, stat cards, and search fields.
- Migrated Customers and Vendors management UIs to the new pattern layer with denser, clearer page structure.
- Improved no-data and no-search-result states for Customers and Vendors without changing data behavior.
- Migrated Bookings management shell/UI structure to design-system patterns while preserving booking/OCR/status workflows.
- Migrated Payments, Expenses, and Refunds management UIs to unified finance patterns with parity-safe behavior.
- Standardized search/pagination behavior so pagination remains list-mode only and search mode shows direct filtered results.
- Migrated Customer Report and Vendor Report surfaces to the new header/search/stats/table pattern while preserving filter and export behavior (CSV/XML/PDF print).
- Added Reporting Center (`/reports`) with grouped catalog, search, and preserved deep-links to existing `/customers/report` and `/vendors/report`.
- Added generic report runner (`/reports/:reportId`) with dense filter bar, reusable summary cards, table rendering, and shared CSV/XML/print export controls.
- Migrated Audit Logs and User Access surfaces to the new shell/pattern layer while preserving owner/admin visibility and user action semantics.
- Expanded smoke validation script to include deep-link route checks, legacy boundary checks, and metrics auth parity checks.

## Behavior-Preserved Decisions
- Active route paths and route guards preserved.
- Role model and module visibility contracts preserved.
- Session-expired handling preserved.
- Maintenance banner behavior preserved.
- Mobile unsupported continue-anyway behavior preserved.
- Hidden dark-mode unlock behavior preserved.

## Compatibility Fixes Applied
- Metrics endpoints now authenticated and owner-restricted.
- Inbound refund payment identity mapping corrected to canonical vendor linkage.
- `PaymentMode.OTHER` normalized in backend enum to align with frontend.
- Booking update semantics changed from `||` fallback to explicit `undefined` checks.
- Broken `bootstrap-owner` package script removed.
- Legacy Firebase-heavy files isolated from strict lint/type baseline.
- Reporting expansion added backend report namespace (`/reports/*`) with org-scoped authenticated access and explicit report-cache invalidation on booking/payment/refund mutations.

## Remaining Legacy Boundary Notes
- Legacy surfaces are preserved via `/legacy/:surface` while active modules remain production-first.
- Further modernization of legacy internal implementations can proceed behind boundary without disturbing active-path parity.

## Batch Progress
- Completed revamp batches:
  - Batch 1: Shell, IA foundation, compatibility fixes, legacy route boundary.
  - Batch 2: Customers + Vendors UX migration on existing contracts.
  - Batch 3: Bookings + Finance (Payments, Expenses, Refunds) UX migration on existing contracts.
  - Batch 4: Reports + Administration (Customer Report, Vendor Report, Audit Logs, User Access) UX migration on existing contracts.
  - Batch 5: Final parity hardening (smoke coverage expansion + release-safety documentation updates).
- Next target batch:
  - Final end-to-end run in target environment with authenticated smoke tokens before release cut.
