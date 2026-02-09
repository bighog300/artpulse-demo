# Runbook — Artpulse

## Local setup

```bash
pnpm install
pnpm prisma:generate
pnpm prisma:migrate
pnpm db:seed
pnpm dev
```

## Smoke test checklist
- Home loads and shows events
- Search returns results
- Event detail SSR renders
- Calendar loads
- Login works
- Favourites work
- Admin pages protected by role

## Troubleshooting
- OAuthCallback: redirect URI mismatch
- Prisma connection: check `DATABASE_URL`
- Admin 403: ensure user role is EDITOR/ADMIN
