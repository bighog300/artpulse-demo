# Prisma migrations baseline

In March 2026 the migration history was rebaselined because the original chain started with a placeholder `init` migration and later migrations referenced `"User"` before that table existed.

## Current strategy

- `prisma/migrations/20260305100000_baseline/migration.sql` is a full baseline generated from `prisma/schema.prisma`.
- This repository currently targets fresh database deployment (for Neon and CI) from that baseline.

## Commands

```bash
pnpm prisma generate
pnpm prisma migrate deploy
```

For migrations that add new foreign keys, run the guard check:

```bash
pnpm prisma:check-migration-order
```

This script ensures tables referenced by `REFERENCES "..."` have already been created earlier in migration order.
