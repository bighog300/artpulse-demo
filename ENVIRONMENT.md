# Environment Configuration — Artpulse

This document defines all environment variables required to run Artpulse locally and on Vercel.

---

## 1. Local Development

Create a file named `.env.local` at the repo root.

```bash
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# Database (Postgres)
DATABASE_URL=postgresql://artpulse:artpulse@localhost:5432/artpulse

# Authentication (Auth.js / NextAuth)
AUTH_SECRET=replace-with-long-random-string
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=

# Maps (optional, enables Nearby map view)
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=

# Blob storage (required for venue gallery + uploads)
BLOB_READ_WRITE_TOKEN=

# Optional / Observability
SENTRY_DSN=
```

---

## 2. Production (Vercel)

Set the same variables in:
Vercel → Project → Settings → Environment Variables

Minimum required:
- `DATABASE_URL`
- `AUTH_SECRET`
- `AUTH_GOOGLE_ID`
- `AUTH_GOOGLE_SECRET`

Optional:
- `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` (enables `/nearby` map view)
- `BLOB_READ_WRITE_TOKEN` (required for Blob image uploads)
- `RATE_LIMIT_VENUE_IMAGES_WRITE_PER_MINUTE` (defaults to `60`)
- `RATE_LIMIT_VENUE_IMAGES_WRITE_WINDOW_MS` (defaults to `60000`)

---

## 3. OAuth Configuration Notes

Google redirect URI:
- `https://<your-domain>/api/auth/callback/google`

Ensure `NEXT_PUBLIC_APP_URL` matches your deployed domain.

---

## 4. Prisma & Migrations

Recommended scripts:

```json
{
  "scripts": {
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:deploy": "prisma migrate deploy"
  }
}
```

---

## 5. Security Rules

- Never commit `.env.local`
- Never expose secrets via `NEXT_PUBLIC_*`


## 6. Blob Notes

- Venue gallery uploads use Vercel Blob server-validated client uploads.
- Keep `BLOB_READ_WRITE_TOKEN` server-side only; never expose it in `NEXT_PUBLIC_*` variables.
- Local development supports uploads when `BLOB_READ_WRITE_TOKEN` is set.

## Artist/Venue gallery client uploads (Vercel Blob)

- Keep `BLOB_READ_WRITE_TOKEN` configured **server-side only**.
- Client uploads use token exchange route handlers (`handleUpload`), then browser uploads directly to Blob.
- Do not expose `BLOB_READ_WRITE_TOKEN` in browser bundles.

## NextAuth production start requirement

- `NEXTAUTH_SECRET` / `AUTH_SECRET` must be set for `pnpm start` in production mode.
