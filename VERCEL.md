# Vercel Deployment — Artpulse

This document describes how to deploy Artpulse from GitHub to Vercel.

## Build settings
- Framework preset: Next.js
- Install: `pnpm install`
- Build: `pnpm build`

## Environment variables
See `ENVIRONMENT.md`.

## Database
- Provision Postgres (Vercel Postgres recommended)
- Set `DATABASE_URL`

## Prisma on Vercel
- `postinstall`: `prisma generate`
- Run migrations: `prisma migrate deploy` (recommended during build)

## Common pitfalls
- OAuthCallback error: fix Google redirect URI to `https://<domain>/api/auth/callback/google`
- Prisma edge runtime: ensure Prisma routes run on Node runtime, not Edge
