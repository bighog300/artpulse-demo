# Runbook — Artpulse Launch Hardening

## Environment variables
### Production
- `AUTH_SECRET`
- `DATABASE_URL`
- `DIRECT_URL` (if used)
- `CRON_SECRET` (required for cron + `/api/cron/health`)
- `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` (maps)

### Local
- Minimal local build: `AUTH_SECRET=dev-secret pnpm build`
- Local checks can run without full production env.

## Vercel cron plan limits
On Vercel Hobby, cron must be daily. This repo uses daily schedules in `vercel.json`.

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

## Cron verification
Dry-run each cron route safely:
```bash
curl -H "Authorization: Bearer $CRON_SECRET" "http://localhost:3000/api/cron/outbox/send?dryRun=1"
curl -H "Authorization: Bearer $CRON_SECRET" "http://localhost:3000/api/cron/digests/weekly?dryRun=1"
curl -H "Authorization: Bearer $CRON_SECRET" "http://localhost:3000/api/cron/retention/engagement?dryRun=1"
```

## Maps + geolocation
- Visit `/nearby`.
- Confirm geolocation permission is available for same-origin.
- Confirm map tiles/workers load (no CSP block for `blob:` worker).

## Personalization measurement (non-prod)
- Verify `personalization_exposure` and `personalization_outcome` emit `version: v3_1` and ranking version.
- Verify exposure dedupe + per-view cap behavior.
- Verify deterministic sampling is full-rate in dev and reduced in production.
