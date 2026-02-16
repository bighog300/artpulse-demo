# Artpulse

Artpulse is an art community web app focused on discovering, publishing, and following art events from galleries, museums, and artists.

## What Artpulse Does (MVP)

- Discover upcoming art events by location and date
- Browse galleries and museums and their programs
- View artist profiles and associated events
- Calendar-based views (month / week / list)
- Save favourites (events, venues, artists)
- Admin/editor tools to publish and manage content

## Core Principles

- Location-first discovery
- Editorial-quality event pages
- Fast, accessible, mobile-first UI
- Clean separation between public content and admin tools

## Tech Stack (summary)

- Next.js (App Router)
- TypeScript
- Postgres + Prisma
- Auth.js / NextAuth
- Deployed on Vercel

## Repo Expectations

Single Next.js app at repo root (recommended for Vercel):

```
/app
/components
/lib
/prisma
/public
```

## Local Development

```bash
pnpm install
pnpm dev
```

See `ENVIRONMENT.md` for required environment variables.

## Database & Prisma Commands

```bash
pnpm prisma:generate
pnpm prisma:migrate
pnpm prisma:deploy
pnpm db:seed
```

## Auth secret required

`AUTH_SECRET` must be set for preview/production-like environments (`VERCEL=1` or `NODE_ENV=production`).

- Generate one with `openssl rand -base64 32`
- Set it in your `.env.local` for local production testing
- Set it in Vercel environment variables for Preview and Production

If missing in production-like environments, auth boot will fail fast with a clear error.

## Deployment

- Push to GitHub
- Import repo into Vercel
- Configure environment variables
- Deploy

## Vercel Deployment Checklist

1. Set the following **production** environment variables in Vercel:
   - `DATABASE_URL`
   - `AUTH_SECRET`
   - `AUTH_GOOGLE_ID`
   - `AUTH_GOOGLE_SECRET`
   - Optional: `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` (enables `/nearby` map view)
2. Ensure the production database is reachable from Vercel.
3. Run migrations on deploy (`pnpm prisma:deploy`) before serving traffic.
4. Optionally run `pnpm db:seed` for initial sample/admin data.
5. Verify `/api/health` returns `{ ok: true }` after deployment.

