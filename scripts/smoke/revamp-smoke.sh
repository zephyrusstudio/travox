#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://localhost:3000}"
WEB_URL="${2:-http://localhost:5173}"
AUTH_TOKEN="${AUTH_TOKEN:-}"
OWNER_TOKEN="${OWNER_TOKEN:-}"

ROUTES=(
  /
  /customers
  /reports
  /reports/sales-by-customer-detail
  /customers/report
  /vendors
  /vendors/report
  /bookings
  /payments
  /expenses
  /refunds
  /logs
  /users
  /legacy/dashboard
  /legacy/ledgers
  /legacy/calendar
  /legacy/settings
  /legacy/tickets
)

require_http_ok() {
  local url="$1"
  local name="$2"
  local code
  code="$(curl -s -o /dev/null -w "%{http_code}" "$url")"
  if [[ "$code" -lt 200 || "$code" -ge 400 ]]; then
    echo "[smoke][fail] ${name}: expected 2xx/3xx, got ${code} (${url})"
    exit 1
  fi
  echo "[smoke][ok] ${name}: ${code}"
}

require_not_public() {
  local url="$1"
  local name="$2"
  local code
  code="$(curl -s -o /dev/null -w "%{http_code}" "$url")"
  if [[ "$code" == "200" ]]; then
    echo "[smoke][fail] ${name}: endpoint is publicly accessible (${url})"
    exit 1
  fi
  echo "[smoke][ok] ${name}: blocked without auth (${code})"
}

require_not_public_post() {
  local url="$1"
  local name="$2"
  local code
  code="$(curl -s -o /dev/null -w "%{http_code}" -X POST "$url")"
  if [[ "$code" =~ ^2 ]]; then
    echo "[smoke][fail] ${name}: POST endpoint is publicly accessible (${url})"
    exit 1
  fi
  echo "[smoke][ok] ${name}: blocked without auth (${code})"
}

require_with_token() {
  local url="$1"
  local name="$2"
  local token="$3"
  local code
  code="$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer ${token}" "$url")"
  if [[ "$code" -lt 200 || "$code" -ge 400 ]]; then
    echo "[smoke][fail] ${name}: token check failed with ${code} (${url})"
    exit 1
  fi
  echo "[smoke][ok] ${name}: ${code}"
}

require_with_token_post() {
  local url="$1"
  local name="$2"
  local token="$3"
  local code
  code="$(curl -s -o /dev/null -w "%{http_code}" -X POST -H "Authorization: Bearer ${token}" "$url")"
  if [[ "$code" -lt 200 || "$code" -ge 400 ]]; then
    echo "[smoke][fail] ${name}: token POST check failed with ${code} (${url})"
    exit 1
  fi
  echo "[smoke][ok] ${name}: ${code}"
}

echo "[smoke] checking backend health"
require_http_ok "$BASE_URL/health" "backend health"

echo "[smoke] checking frontend shell"
require_http_ok "$WEB_URL" "frontend shell"

echo "[smoke] checking frontend routes (active + legacy boundaries)"
for r in "${ROUTES[@]}"; do
  require_http_ok "$WEB_URL$r" "route $r"
done

echo "[smoke] checking security parity for metrics endpoints"
require_not_public "$BASE_URL/metrics" "metrics GET auth"
require_not_public_post "$BASE_URL/metrics/reset" "metrics reset POST auth"

if [[ -n "$AUTH_TOKEN" ]]; then
  echo "[smoke] checking protected active API endpoints using AUTH_TOKEN"
  require_with_token "$BASE_URL/customers?limit=1&offset=0" "customers list token auth" "$AUTH_TOKEN"
  require_with_token "$BASE_URL/vendors?limit=1&offset=0" "vendors list token auth" "$AUTH_TOKEN"
  require_with_token "$BASE_URL/bookings?limit=1&offset=0" "bookings list token auth" "$AUTH_TOKEN"
  require_with_token "$BASE_URL/reports/catalog" "reports catalog token auth" "$AUTH_TOKEN"
  require_with_token "$BASE_URL/reports/sales-by-customer-detail?interval=2026-01-01,2026-03-31" "reports data token auth" "$AUTH_TOKEN"
else
  echo "[smoke][note] AUTH_TOKEN not set; skipping authenticated active API checks"
fi

if [[ -n "$OWNER_TOKEN" ]]; then
  echo "[smoke] checking owner-only metrics endpoint using OWNER_TOKEN"
  require_with_token "$BASE_URL/metrics" "metrics owner access" "$OWNER_TOKEN"
  require_with_token_post "$BASE_URL/metrics/reset" "metrics reset owner access" "$OWNER_TOKEN"
else
  echo "[smoke][note] OWNER_TOKEN not set; skipping owner-only metrics positive check"
fi

echo "[smoke][ok] revamp smoke checks completed"
