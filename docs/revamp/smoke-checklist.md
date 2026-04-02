# Travox Revamp Smoke Checklist

## Script
- `scripts/smoke/revamp-smoke.sh`

## Coverage
- Backend health endpoint availability (`/health`)
- Frontend shell availability (`/`)
- Active route deep-link availability:
  - `/customers`, `/reports`, `/reports/sales-by-customer-detail`, `/customers/report`, `/vendors`, `/vendors/report`
  - `/bookings`, `/payments`, `/expenses`, `/refunds`
  - `/logs`, `/users`
- Legacy boundary route availability:
  - `/legacy/dashboard`, `/legacy/ledgers`, `/legacy/calendar`, `/legacy/settings`, `/legacy/tickets`
- Security parity:
  - unauthenticated `/metrics` and `/metrics/reset` must not be publicly accessible
- Optional authenticated checks:
  - active API list endpoints with `AUTH_TOKEN`
  - reporting API checks (`/reports/catalog`, `/reports/sales-by-customer-detail`) with `AUTH_TOKEN`
  - owner metrics access with `OWNER_TOKEN`

## Usage
- Basic:
  - `./scripts/smoke/revamp-smoke.sh http://localhost:3000 http://localhost:5173`
- With authenticated checks:
  - `AUTH_TOKEN="<jwt>" OWNER_TOKEN="<owner-jwt>" ./scripts/smoke/revamp-smoke.sh http://localhost:3000 http://localhost:5173`

## Notes
- Script is intended for quick parity smoke validation, not full end-to-end business assertion.
- Full business parity remains covered by module-level tests and manual workflow verification.
