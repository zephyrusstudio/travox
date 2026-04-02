# Travox Revamp Parity Matrix

| Module/Surface | Route/Entry | Role Access | Preserved Actions | Preserved Rules | Revamp Status | Test Reference |
|---|---|---|---|---|---|---|
| Auth | `/` | Public | Google sign-in, token storage, refresh recovery | session-expired re-login path unchanged | Revamped | `scripts/smoke/revamp-smoke.sh` + `docs/revamp/smoke-checklist.md` |
| Customers | `/customers` | Owner/Admin | list/search/create/edit/delete/import/account/stats links | masking/unmasking, CSV import semantics | Revamped (Batch 2) | smoke routes + module API checks |
| Reporting Center | `/reports`, `/reports/:reportId` | Owner/Admin | catalog, report-runner filters, summary, table, CSV/XML/print export | existing `/customers/report` and `/vendors/report` links preserved; org/auth scope preserved | Expanded (Batch 5) | smoke routes + reports API checks |
| Customer Report | `/customers/report` | Owner/Admin | interval filters, pendingOnly, detail drilldown, exports | CSV/XML/print behavior preserved | Revamped (Batch 4) | smoke routes + report export checks |
| Vendors | `/vendors` | Owner/Admin | list/search/create/edit/delete/account/stats | duplicate and service-type semantics preserved | Revamped (Batch 2) | smoke routes + module API checks |
| Vendor Report | `/vendors/report` | Owner/Admin | interval filters and exports | CSV/XML/print behavior preserved | Revamped (Batch 4) | smoke routes + report export checks |
| Bookings | `/bookings` | Owner/Admin | create/edit/view/search/filter/stats/OCR prefill/delete pathways | status transition and amount semantics preserved | Revamped (Batch 3) | smoke routes + booking workflow checks |
| Payments | `/payments` | Owner/Admin | receivable create/list | overpayment prevention and aggregate effects preserved | Revamped (Batch 3) | smoke routes + finance workflow checks |
| Expenses | `/expenses` | Owner/Admin | expense create/list | account/vendor link semantics preserved | Revamped (Batch 3) | smoke routes + finance workflow checks |
| Refunds | `/refunds` | Owner/Admin | outbound/inbound refund flows | booking/customer/vendor side effects preserved | Revamped (Batch 3) | smoke routes + finance workflow checks |
| Audit Logs | `/logs` | Owner | list/filter/export/detail | owner-only visibility preserved | Revamped (Batch 4) | smoke routes + role gate checks |
| User Access | `/users` | Owner | list/role-change/activate/deactivate | last-owner protection preserved | Revamped (Batch 4) | smoke routes + role gate checks |
| Dashboard (Legacy) | `/legacy/dashboard` | Authenticated | preserved as controlled legacy surface | no capability deletion, isolated boundary | Legacy isolated | smoke legacy-boundary route checks |
| Ledgers (Legacy) | `/legacy/ledgers` | Authenticated | preserved as controlled legacy surface | no capability deletion, isolated boundary | Legacy isolated | smoke legacy-boundary route checks |
| Calendar (Legacy) | `/legacy/calendar` | Authenticated | preserved as controlled legacy surface | no capability deletion, isolated boundary | Legacy isolated | smoke legacy-boundary route checks |
| Settings (Legacy) | `/legacy/settings` | Authenticated | preserved as controlled legacy surface | Firebase-coupled stale paths isolated | Legacy isolated | smoke legacy-boundary route checks |
| Tickets (Legacy) | `/legacy/tickets` | Authenticated | preserved as controlled legacy surface | stale Firebase contamination isolated | Legacy isolated | smoke legacy-boundary route checks |
