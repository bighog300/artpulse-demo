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

# Maps
NEXT_PUBLIC_MAP_PROVIDER=mapbox
NEXT_PUBLIC_MAPBOX_TOKEN=

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
