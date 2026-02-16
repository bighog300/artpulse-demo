# Environments

Artpulse runs three deployment environments with isolated Neon branches.

## Production
- **Neon branch**: `main`
- **Vercel environment**: `production`
- **Database URL usage**:
  - `DATABASE_URL`: pooled Neon URL for runtime app traffic
  - `DIRECT_URL`: direct Neon URL for migrations/tooling

## Staging
- **Neon branch**: `staging` (long-lived)
- **Vercel environment**: either a dedicated Staging project or preview env mapped to git branch `staging`
- **Automation**: `.github/workflows/staging-db.yml`
  - ensures `staging` branch exists
  - runs `prisma migrate deploy` with `DIRECT_URL`
  - runs drift detection gate
  - optionally runs `pnpm db:seed` if `STAGING_SEED_ENABLED=true` repository variable

## Preview (per PR)
- **Neon branch**: `pr-<number>`
- **Vercel environment**: preview deployment for the PR branch
- **Automation**: `.github/workflows/preview-db.yml`
  - on PR open/sync/reopen: create/update branch, migrate, drift check, seed
  - on PR close: delete branch unless label `keep-preview-db` exists

## Required secrets
Configure the following in GitHub Actions secrets:
- `NEON_API_KEY`
- `NEON_PROJECT_ID`
- `VERCEL_TOKEN` (if using automated Vercel env writes)
- `VERCEL_ORG_ID` (if using automated Vercel env writes)
- `VERCEL_PROJECT_ID` (if using automated Vercel env writes)

Application runtime secrets still required in Vercel:
- `AUTH_SECRET`
- `NEXTAUTH_URL`
- `CRON_SECRET`
- provider-specific auth tokens (if enabled)
