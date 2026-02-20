# Vercel Deployment — Artpulse

## Deterministic build configuration
- Install command: `pnpm run vercel:install`
- Build command: `pnpm run vercel:build`
- `vercel:build` runs `scripts/check-env.mjs` before `next build` so deploys fail early when required environment is missing.

## Environment variables
### Required in deploy contexts (`VERCEL=1` or `CI=true`)
- `AUTH_SECRET`
- `DATABASE_URL`

### Conditionally required when feature is enabled
- `DIRECT_URL` (if direct Prisma connection is used)
- `CRON_SECRET` (required when `vercel.json` defines `crons`)
- `NEXT_PUBLIC_MAPBOX_TOKEN` (canonical; `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` also supported)

## Vercel cron limits (Hobby)
Vercel Hobby only supports daily cron jobs. This repo schedules all cron jobs once daily to remain deploy-safe on Hobby:
- `/api/cron/outbox/send` → `5 2 * * *`
- `/api/cron/digests/weekly` → `20 2 * * *`
- `/api/cron/retention/engagement` → `35 2 * * *`

If you need higher frequency, upgrade plan and adjust schedules intentionally.

## Private beta env vars

Add these project environment variables in Vercel when running private beta:

- `BETA_MODE` (`1` to enable)
- `BETA_ALLOWLIST` (comma-separated emails)
- `BETA_ALLOW_DOMAINS` (comma-separated domains)
- `BETA_ADMIN_EMAILS` (comma-separated admin emails)
- `BETA_REQUESTS_ENABLED` (`1` enabled, `0` disabled)

`BETA_ALLOWLIST` and related values are evaluated at runtime from env, so updates require a redeploy.
