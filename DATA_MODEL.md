# Data Model — Artpulse

This document defines the MVP data model for Artpulse. It is designed to map cleanly to Prisma + Postgres.

---

## 1. Core Entities

### 1.1 User

Represents an authenticated account.

**Fields**
- `id` (uuid)
- `email` (unique)
- `name` (optional)
- `imageUrl` (optional)
- `role` enum: `USER | EDITOR | ADMIN`
- `createdAt`
- `updatedAt`

**Notes**
- MVP stores minimal PII.
- Roles gate admin/editor actions.

---

### 1.2 Venue

Represents a gallery, museum, or other location.

**Fields**
- `id` (uuid)
- `name`
- `slug` (unique)
- `description` (optional)
- `addressLine1` (optional)
- `addressLine2` (optional)
- `city` (optional)
- `region` (optional)
- `country` (optional)
- `postcode` (optional)
- `lat` (optional, float)
- `lng` (optional, float)
- `websiteUrl` (optional)
- `instagramUrl` (optional)
- `contactEmail` (optional)
- `isPublished` (boolean, default false)
- `createdAt`
- `updatedAt`

**Relationships**
- Venue `hasMany` Events

---

### 1.3 Artist

Represents an artist profile.

**Fields**
- `id` (uuid)
- `name`
- `slug` (unique)
- `bio` (optional)
- `websiteUrl` (optional)
- `instagramUrl` (optional)
- `avatarImageUrl` (optional)
- `isPublished` (boolean, default false)
- `createdAt`
- `updatedAt`

**Relationships**
- Artist `manyToMany` Events (via EventArtist)

---

### 1.4 Event

Represents an art event: opening, exhibition, talk, workshop, fair, etc.

**Fields**
- `id` (uuid)
- `title`
- `slug` (unique)
- `description` (optional)
- `startAt` (datetime)
- `endAt` (datetime, optional)
- `timezone` (string, e.g. `Europe/London`)
- `eventType` enum (optional): `EXHIBITION | OPENING | TALK | WORKSHOP | FAIR | OTHER`
- `ticketUrl` (optional)
- `priceText` (optional)
- `isFree` (optional boolean)
- `organizerName` (optional)
- `venueId` (optional) — supports pop-up events
- `lat` (optional, float) — for non-venue events
- `lng` (optional, float)
- `isPublished` (boolean, default false)
- `publishedAt` (optional datetime)
- `createdAt`
- `updatedAt`

**Relationships**
- Event `belongsTo` Venue (optional)
- Event `hasMany` EventImage
- Event `manyToMany` Tags (via EventTag)
- Event `manyToMany` Artists (via EventArtist)

---

### 1.5 Tag

Taxonomy for events (e.g. “Photography”, “Sculpture”, “Free Entry”).

**Fields**
- `id` (uuid)
- `name` (unique)
- `slug` (unique)
- `createdAt`

**Relationships**
- Tag `manyToMany` Events (via EventTag)

---

### 1.6 EventImage

Stores one or more images for an event.

**Fields**
- `id` (uuid)
- `eventId`
- `url`
- `alt` (optional)
- `sortOrder` (int, default 0)
- `createdAt`

**Relationships**
- EventImage `belongsTo` Event

---

### 1.7 Favorite

Allows a user to save an event, venue, or artist.

**Fields**
- `id` (uuid)
- `userId`
- `targetType` enum: `EVENT | VENUE | ARTIST`
- `targetId` (uuid)
- `createdAt`

**Constraints**
- Unique composite: (`userId`, `targetType`, `targetId`)

---

## 2. Join Tables

### 2.1 EventTag

**Fields**
- `eventId`
- `tagId`

**Constraints**
- Unique composite: (`eventId`, `tagId`)

---

### 2.2 EventArtist

**Fields**
- `eventId`
- `artistId`
- `role` (optional, string: e.g. “Speaker”, “Exhibiting Artist”)

**Constraints**
- Unique composite: (`eventId`, `artistId`)

---

## 3. Optional (MVP-lite) Editorial

### 3.1 EditorialPost (optional)

If included in MVP, keep it minimal.

**Fields**
- `id` (uuid)
- `title`
- `slug` (unique)
- `body` (markdown)
- `coverImageUrl` (optional)
- `isPublished` (boolean)
- `publishedAt` (optional)
- `createdAt`
- `updatedAt`

---

## 4. Publishing Rules

- Public pages only show `isPublished = true` records.
- Events may be shown after end date, but marked as past.
- `publishedAt` is set when transitioning draft → published.

---

## 5. Geo & Search (MVP)

- Prefer venue coordinates as event coordinates when `venueId` is present.
- For pop-ups, use Event `lat/lng`.
- Radius search:
  - Bounding box filter first
  - Distance refinement second

---

## 6. Prisma Mapping Notes

- Use `@@index` on:
  - `Event.startAt`
  - `Event.isPublished`
  - `Venue.isPublished`
  - `Artist.isPublished`
  - `Event.venueId`
- Use unique constraints for slugs.
- Favourites should enforce uniqueness to avoid duplicates.
