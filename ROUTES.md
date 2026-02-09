# Routes — Artpulse

This document defines the user-facing routes (pages) for the Next.js app.

---

## Public Routes

- `/` Home (nearby/upcoming)
- `/search` Search + filters
- `/events` Events list
- `/events/[slug]` Event detail
- `/venues` Venues list
- `/venues/[slug]` Venue detail
- `/artists` Artists list
- `/artists/[slug]` Artist detail
- `/calendar` Calendar view
- `/privacy` Privacy (placeholder)
- `/terms` Terms (placeholder)

---

## Auth & Account Routes

- `/login`
- `/account` (saved favourites)

---

## Admin Routes

All require role `EDITOR` or `ADMIN`.

- `/admin` Dashboard
- `/admin/events` CRUD
- `/admin/events/new` Create
- `/admin/events/[id]` Edit
- `/admin/venues` CRUD
- `/admin/venues/new`
- `/admin/venues/[id]`
- `/admin/artists` CRUD
- `/admin/artists/new`
- `/admin/artists/[id]`

---

## Suggested App Router Structure

```
app/
  page.tsx
  search/page.tsx
  events/page.tsx
  events/[slug]/page.tsx
  venues/page.tsx
  venues/[slug]/page.tsx
  artists/page.tsx
  artists/[slug]/page.tsx
  calendar/page.tsx
  login/page.tsx
  account/page.tsx
  admin/page.tsx
  admin/events/page.tsx
  admin/events/new/page.tsx
  admin/events/[id]/page.tsx
  admin/venues/...
  admin/artists/...
```
