# Architecture — Artpulse

## 1. Goals

- Ship an MVP that is **Vercel-native**, reliable, and easy to maintain.
- Keep a clean separation between **public discovery** features and **admin publishing** tools.
- Prioritize SEO and fast initial loads for event pages.

---

## 2. System Overview

Artpulse is a **single Next.js application** deployed on Vercel.

- **Next.js App Router** provides:
  - Server-rendered pages (SEO)
  - API route handlers for CRUD/search
- **Postgres** stores all persistent data
- **Prisma** is the ORM + migration layer
- **Auth** (Auth.js / NextAuth) handles sign-in and roles

Optional (Post-MVP): background jobs, moderation queue, richer editorial pipeline.

---

## 3. High-Level Components

### 3.1 Web UI (Next.js)

- Public pages: home, search, event detail, venue detail, artist detail, calendar
- Auth pages: login, account
- Admin pages: event/venue/artist CRUD, publish workflow

**Rendering strategy**

- Use **Server Components** for initial data fetching where possible.
- Use **Client Components** for interactive filters, map, and calendar interactions.

### 3.2 API Layer (Next.js Route Handlers)

- Located under `app/api/**/route.ts`
- Public endpoints for reads/search
- Authenticated endpoints for favourites
- Editor/Admin endpoints for CRUD

**Key architectural choices**

- Validate all input with **Zod**
- Return consistent JSON error format
- Prefer idempotent updates (`PATCH`) and soft delete where possible

### 3.3 Data Layer

- Prisma Client for DB access
- Schema versioned via migrations
- Seed scripts for initial data and admin user

---

## 4. Data Access Patterns

### Public reads

- Home and list pages query **published** records only
- Search endpoints support:
  - keyword query
  - date range
  - location radius (lat/lng)
  - tags

### Admin writes

- CRUD operations gated by role checks
- Draft/publish workflow via `isPublished` flag
- Audit fields: `createdAt`, `updatedAt`, optional `publishedAt`

---

## 5. Authentication & Authorization

### Authentication

- Use Auth.js / NextAuth for session management
- Providers:
  - Google OAuth (recommended)
  - Email magic link (optional)

### Authorization

Role-based access control (RBAC):

- `USER` — can save favourites
- `EDITOR` — can create/edit/publish content
- `ADMIN` — all editor permissions + user/role management (later)

**Enforcement points**

- API route handlers perform the role check
- Admin UI routes also guard at the page level

---

## 6. Search, Geo, and Indexing

### MVP geo approach

- Store `lat` and `lng` on venues (and optionally events)
- Radius search:
  - compute bounding box server-side
  - apply coarse DB filter then refine by distance

### Upgrade path

- Add PostGIS for advanced geo queries

---

## 7. Performance & Caching

- Use Next.js caching defaults for public pages where safe
- Avoid caching personalised content (favourites)
- Consider Vercel Edge caching for public lists (later)

---

## 8. File/Folder Layout (recommended)

```
app/
  (public)/
    page.tsx
    events/
    venues/
    artists/
    calendar/
  (auth)/
    login/
    account/
  admin/
    page.tsx
    events/
    venues/
    artists/
  api/
    events/
    venues/
    artists/
    favorites/
    admin/
      events/
      venues/
      artists/
components/
lib/
  db.ts
  auth.ts
  geo.ts
  slug.ts
prisma/
  schema.prisma
  migrations/
```

---

## 9. Error Handling Conventions

API error shape:

```json
{
  "error": {
    "code": "invalid_request",
    "message": "Human readable message",
    "details": {"field": "explanation"}
  }
}
```

- Use appropriate HTTP status codes
- Never leak secrets or stack traces in production

---

## 10. Deployment Architecture (Vercel)

- Vercel builds the Next.js app
- Postgres provisioned via:
  - Vercel Postgres, or
  - Neon / Supabase
- Migrations executed via `prisma migrate deploy`

---

## 11. Future Add-ons

- Editorial posts and news
- Featured events (curation)
- Importers (Eventbrite, venue calendars)
- Notifications (email digests)
- Mobile app (React Native)
