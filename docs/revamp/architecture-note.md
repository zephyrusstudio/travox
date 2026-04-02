# Travox UX Revamp Architecture Note

## Old IA
- Flat module-first sidebar with active routed modules only.
- Legacy surfaces (dashboard, ledgers, calendar, settings, tickets) existed in code but were not first-class in navigation.
- Inconsistent shell affordances for breadcrumbs, global actions, and cross-module search.

## New Hybrid IA
- Task-grouped navigation with explicit domain labels.
- Groups:
  - Operations: Customers, Vendors, Bookings
  - Finance: Payments, Expenses, Refunds, Ledgers (legacy boundary)
  - Reporting: Reporting Center, Customer Report, Vendor Report, Dashboard (legacy boundary)
  - Administration: Audit Logs, User Access, Settings (legacy boundary)
  - Utilities: Calendar (legacy boundary), Tickets/OCR (legacy boundary)

## Why Hybrid IA
- Travox users think in domain entities (customers/vendors/bookings/payments).
- Pure abstract workspaces would reduce discoverability for frequent operational tasks.
- Hybrid model improves intuitiveness while preserving direct object-based navigation.

## Route Preservation
- Existing active routes were preserved unchanged:
  - `/customers`, `/customers/report`, `/vendors`, `/vendors/report`, `/bookings`, `/payments`, `/expenses`, `/refunds`, `/logs`, `/users`
- Added reporting-center expansion routes:
  - `/reports`
  - `/reports/:reportId`
- Existing report direct routes remain preserved:
  - `/customers/report`
  - `/vendors/report`
- Added controlled legacy boundary routes:
  - `/legacy/:surface`
- Existing auth guard, module gate, redirect semantics remain unchanged for active routes.

## Legacy Handling
- Legacy surfaces are explicitly preserved behind controlled boundary navigation.
- Legacy Firebase-coupled areas are isolated from strict lint/type baseline to prevent active-path regression risk.
- Capability footprint is retained while modernization proceeds incrementally.

## Current Migration State
- All active routed modules are now migrated to the revamp shell/pattern layer.
- Legacy surfaces remain preserved under explicit legacy boundary routes.
- Hybrid IA route semantics remain intact with deep-link compatibility preserved.
