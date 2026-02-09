# Seeding — Artpulse

- Provide `pnpm db:seed`
- Create initial admin from env:
  - ARTPULSE_ADMIN_EMAIL
  - ARTPULSE_ADMIN_NAME
- Seed tags, venues, artists, and a handful of events
- Seed scripts should be idempotent (upsert)
- Never run seeding automatically in production
