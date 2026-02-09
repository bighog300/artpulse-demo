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

## Deployment

- Push to GitHub
- Import repo into Vercel
- Configure environment variables
- Deploy
