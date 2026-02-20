# Runbook — Artpulse Launch Hardening

## Environment variables
### Production
- `AUTH_SECRET`
- `DATABASE_URL`
- `DIRECT_URL` (if used)
- `CRON_SECRET` (required for cron + `/api/cron/health`)
- `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` (maps)
- Optional monitoring and alerting:
  - `SENTRY_DSN` (optional, provider integration)
  - `SENTRY_TRACES_SAMPLE_RATE` (optional)
  - `ALERT_WEBHOOK_URL` (recommended alert sink)
  - `ALERT_WEBHOOK_SECRET` (optional HMAC signing secret)
  - `OPS_SECRET` (required for `/api/ops/metrics` bearer auth)

### Local
- Minimal local build: `AUTH_SECRET=dev-secret pnpm build`
- Local checks can run without full production env.

## Vercel plan limits
- On Vercel Hobby, cron must be daily. This repo uses daily schedules in `vercel.json`.
- Log drains are Pro/Enterprise-only. This sprint does not rely on drains.

## Smoke test locally
```bash
pnpm install
pnpm test
AUTH_SECRET=dev-secret pnpm build
./scripts/smoke.sh
```

## Health checks
- App health: `GET /api/health`
- Cron health (protected):
  ```bash
  curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/health
  ```
- Ops metrics (protected):
  ```bash
  curl -H "Authorization: Bearer $OPS_SECRET" http://localhost:3000/api/ops/metrics
  ```

## Cron verification
Dry-run each cron route safely (all responses include `cronRunId`):
```bash
curl -H "Authorization: Bearer $CRON_SECRET" "http://localhost:3000/api/cron/outbox/send?dryRun=1"
curl -H "Authorization: Bearer $CRON_SECRET" "http://localhost:3000/api/cron/digests/weekly?dryRun=1"
curl -H "Authorization: Bearer $CRON_SECRET" "http://localhost:3000/api/cron/retention/engagement?dryRun=1"
```

## Alert triggers
- Cron failure alert: any cron exception, `ok=false`, or non-zero `errorCount`.
- Cron stall alert: watchdog checks in `/api/cron/health` if last success age exceeds threshold.
- Outbox backlog alert: watchdog warns when pending outbox count exceeds threshold.
- If no webhook sink is configured, alerts are emitted as structured logs.

## Monitoring behavior
- Default provider: structured console JSON logs.
- Optional provider: Sentry when `SENTRY_DSN` is set.
- Captured context is privacy-safe (requestId, cronRunId, route, boolean auth scope, counters); no user ids/emails, no raw query text, no lat/lng.

## Maps + geolocation
- Visit `/nearby`.
- Confirm geolocation permission is available for same-origin.
- Confirm map tiles/workers load (no CSP block for `blob:` worker).

## Personalization measurement (non-prod)
- Verify `personalization_exposure` and `personalization_outcome` emit version and ranking version.
- Verify exposure dedupe + per-view cap behavior.
- Verify deterministic sampling is full-rate in dev and reduced in production.
