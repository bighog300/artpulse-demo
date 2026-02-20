#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"
FAILED=0

run() {
  echo "==> $*"
  if ! eval "$*"; then
    FAILED=1
    echo "FAIL: $*"
  else
    echo "OK: $*"
  fi
}

run "pnpm test"
run "AUTH_SECRET=dev-secret pnpm build"
run "curl -fsS ${BASE_URL}/api/health"
run "curl -fsS '${BASE_URL}/api/events?limit=1'"

if [[ -n "${CRON_SECRET:-}" ]]; then
  run "curl -fsS -H 'Authorization: Bearer ${CRON_SECRET}' '${BASE_URL}/api/cron/outbox/send?dryRun=1'"
  run "curl -fsS -H 'Authorization: Bearer ${CRON_SECRET}' '${BASE_URL}/api/cron/digests/weekly?dryRun=1'"
  run "curl -fsS -H 'Authorization: Bearer ${CRON_SECRET}' '${BASE_URL}/api/cron/retention/engagement?dryRun=1'"
else
  echo "WARN: CRON_SECRET not set, skipping cron dry-run checks"
fi

if [[ "$FAILED" -eq 1 ]]; then
  echo "SMOKE RESULT: FAIL"
  exit 1
fi

echo "SMOKE RESULT: OK"
