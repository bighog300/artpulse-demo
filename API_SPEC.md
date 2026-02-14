# API Spec — Artpulse (Next.js Route Handlers)

This spec describes the HTTP API implemented via Next.js route handlers under `app/api/**/route.ts`.

- Base path: `/api`
- Content-Type: `application/json`
- Authentication: session cookie (Auth.js / NextAuth)

---

## 1. Conventions

### 1.1 Error shape

All errors return:

```json
{
  "error": {
    "code": "invalid_request",
    "message": "Human readable message",
    "details": {"field": "explanation"}
  }
}
```

### 1.2 Pagination

Use cursor pagination where relevant:

- Request: `?cursor=<opaque>&limit=20`
- Response:

```json
{
  "items": [],
  "nextCursor": "..."
}
```

### 1.3 Publish rules

- Public endpoints return **published** entities only.
- Admin endpoints can access drafts.

### 1.4 Date/time

- Use ISO-8601 timestamps in UTC for API payloads.
- `timezone` is stored for display; clients can format accordingly.

---

## 2. Public Read APIs

### 2.1 Events search

`GET /api/events`

**Query params**
- `query` (string, optional) — keyword
- `from` (ISO date/datetime, optional)
- `to` (ISO date/datetime, optional)
- `lat` (number, optional)
- `lng` (number, optional)
- `radiusKm` (number, optional; default 25)
- `tags` (comma-separated slugs, optional)
- `venue` (venue slug, optional)
- `artist` (artist slug, optional)
- `cursor` (optional)
- `limit` (optional, default 20)

**Response 200**

```json
{
  "items": [
    {
      "id": "uuid",
      "title": "...",
      "slug": "...",
      "startAt": "2026-02-09T18:00:00Z",
      "endAt": "2026-02-09T20:00:00Z",
      "timezone": "Europe/London",
      "venue": {"name": "...", "slug": "...", "city": "..."},
      "primaryImageUrl": "...",
      "tags": [{"name": "...", "slug": "..."}]
    }
  ],
  "nextCursor": null
}
```

### 2.2 Event detail

`GET /api/events/[slug]`

**Response 200** (see full doc in repo)

- 404 `not_found`

### 2.3 Venues list/search

`GET /api/venues`

### 2.4 Venue detail

`GET /api/venues/[slug]`

### 2.5 Artists list/search

`GET /api/artists`

### 2.6 Artist detail

`GET /api/artists/[slug]`

### 2.7 Tags

`GET /api/tags`

---

## 3. Authenticated APIs

### 3.1 List favourites

`GET /api/favorites` (auth required)

### 3.2 Create favourite

`POST /api/favorites` (auth required)

### 3.3 Delete favourite

`DELETE /api/favorites/[id]` (auth required)

---

## 4. Admin / Editor APIs

All admin endpoints require role `EDITOR` or `ADMIN`.

- `POST /api/admin/events`
- `PATCH /api/admin/events/[id]`
- `DELETE /api/admin/events/[id]`
- `POST /api/admin/venues`
- `PATCH /api/admin/venues/[id]`
- `DELETE /api/admin/venues/[id]`
- `POST /api/admin/artists`
- `PATCH /api/admin/artists/[id]`
- `DELETE /api/admin/artists/[id]`

---

## 5. Validation Rules (summary)

- `slug` must be lowercase, hyphenated, unique
- `startAt` required; `endAt` optional but must be >= `startAt`
- `lat/lng` must be valid ranges if present
- URLs must be valid `http(s)` URLs

---

## 6. Security & Rate Limiting (MVP)

- Require auth for favourites and all admin endpoints
- Add basic rate limiting later if needed
- Prevent enumeration: keep IDs opaque and use slugs for public reads

---

## 3. Authenticated Venue Gallery APIs

All endpoints below require an authenticated session and venue membership.

### 3.1 Generate venue image upload token

`POST /api/my/venues/[id]/images/upload-url`

Uses Vercel Blob client-upload handshake and returns the Blob token payload required by `@vercel/blob/client`.

**Request body**

```json
{
  "type": "blob.generate-client-token",
  "payload": {
    "pathname": "venues/<venueId>/file.jpg",
    "clientPayload": "{\"fileName\":\"file.jpg\",\"contentType\":\"image/jpeg\",\"size\":12345}",
    "multipart": false,
    "callbackUrl": "..."
  }
}
```

**Response 200**

```json
{
  "type": "blob.generate-client-token",
  "clientToken": "..."
}
```

### 3.2 Create venue image record

`POST /api/my/venues/[id]/images`

**Request body**

```json
{
  "url": "https://...public.blob.vercel-storage.com/...",
  "key": "optional/blob/path",
  "alt": "Optional alt text"
}
```

**Response 201**

```json
{
  "image": {
    "id": "uuid",
    "url": "https://...",
    "alt": "Optional alt text",
    "sortOrder": 0
  }
}
```

### 3.3 Update venue image alt text

`PATCH /api/my/venues/images/[imageId]`

**Request body**

```json
{ "alt": "Updated alt text" }
```

**Response 200**

```json
{ "image": { "id": "uuid", "url": "...", "alt": "Updated alt text", "sortOrder": 0 } }
```

### 3.4 Reorder venue images

`PATCH /api/my/venues/[id]/images/reorder`

**Request body**

```json
{ "orderedIds": ["uuid-1", "uuid-2"] }
```

**Response 200**

```json
{ "ok": true }
```

### 3.5 Set venue cover image

`PATCH /api/my/venues/[id]/cover`

Use an existing venue gallery image as the venue cover used on public venue cards and share metadata.

**Request body**

```json
{ "imageId": "uuid" }
```

`venueImageId` is accepted as an alias for `imageId`.

**Response 200**

```json
{
  "cover": {
    "featuredAssetId": "uuid-or-null",
    "featuredImageUrl": "https://...or-null"
  }
}
```

If the selected venue image has an `assetId`, the API sets `featuredAssetId` and clears `featuredImageUrl`.
If it has no `assetId`, the API sets `featuredImageUrl` and clears `featuredAssetId`.

### 3.6 Delete venue image

`DELETE /api/my/venues/images/[imageId]`

**Response 200**

```json
{ "ok": true }
```

### 3.7 Errors

Error shape follows global conventions (`error.code` values include `invalid_request`, `unauthorized`, `forbidden`, `rate_limited`).

## 7. Venue Publish Workflow APIs

### 7.1 Submit venue for review

`POST /api/my/venues/[id]/submit` (auth + venue membership required)

**Request body**

```json
{
  "message": "Optional note to moderators"
}
```

**Response 200**

```json
{
  "submission": {
    "id": "uuid",
    "status": "SUBMITTED",
    "createdAt": "2026-02-14T10:00:00.000Z"
  }
}
```

**Validation failure (400 invalid_request)**

```json
{
  "error": {
    "code": "invalid_request",
    "message": "Venue is not ready for review",
    "details": {
      "issues": [
        { "field": "description", "message": "Description must be at least 50 characters" },
        { "field": "coverImage", "message": "Add a cover image before submitting" }
      ]
    }
  }
}
```

### 7.2 Approve venue submission

`POST /api/admin/submissions/[id]/approve` (editor/admin required)

Supports both `VENUE` and `EVENT` submissions.

**Response 200**

```json
{ "ok": true }
```

### 7.3 Request changes on venue submission

`POST /api/admin/submissions/[id]/request-changes` (editor/admin required)

Supports both `VENUE` and `EVENT` submissions.

**Request body**

```json
{ "message": "Please add opening hours and expand the venue description." }
```

**Response 200**

```json
{ "ok": true }
```

All endpoints return the standard error shape (`unauthorized`, `forbidden`, `invalid_request`, `rate_limited`) in `error.code`.

### 7.4 Submit event for review

`POST /api/my/venues/[venueId]/events/[eventId]/submit` (auth + venue membership required)

**Request body**

```json
{
  "message": "Optional note to moderators"
}
```

**Response 200**

```json
{
  "submission": {
    "id": "uuid",
    "status": "SUBMITTED",
    "createdAt": "2026-02-14T10:00:00.000Z"
  }
}
```

**Validation failure (400 invalid_request)**

```json
{
  "error": {
    "code": "invalid_request",
    "message": "Event is not ready for review",
    "details": {
      "issues": [
        { "field": "description", "message": "Description must be at least 50 characters" },
        { "field": "coverImage", "message": "Add at least one event image before submitting" }
      ]
    }
  }
}
```
