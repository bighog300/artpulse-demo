# CI/CD — Artpulse

## CI (GitHub Actions)
On PRs and pushes to `main`:
- Install (pnpm)
- Lint
- Typecheck
- Unit tests
- Build

## Deployment (Vercel)
- `main` → production
- PRs → preview deployments

## Migrations
- Don’t run migrations from GitHub Actions against prod DB.
- Run `prisma migrate deploy` during Vercel build for production.
