# Runbook — Artpulse

## Local setup

```bash
pnpm install
pnpm prisma:generate
pnpm prisma:migrate   # dev migrations
pnpm prisma:deploy    # deploy migrations
pnpm db:seed          # seed baseline data/admin
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
- API health endpoint responds with `{ ok: true }` at `/api/health`

## Troubleshooting
- OAuthCallback: redirect URI mismatch
- Prisma connection: check `DATABASE_URL`
- Admin 403: ensure user role is EDITOR/ADMIN

## Admin seed env vars

When running `pnpm db:seed`, set these to create/update the initial admin user:

- `ARTPULSE_ADMIN_EMAIL`
- `ARTPULSE_ADMIN_NAME`
