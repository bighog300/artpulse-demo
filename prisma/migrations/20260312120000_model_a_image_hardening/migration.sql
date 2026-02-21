WITH ranked AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (
      PARTITION BY "eventId"
      ORDER BY "sortOrder" ASC, "createdAt" ASC, "id" ASC
    ) AS rn
  FROM "EventImage"
  WHERE "isPrimary" = true
)
UPDATE "EventImage" e
SET "isPrimary" = false
FROM ranked r
WHERE e."id" = r."id" AND r.rn > 1;

WITH ranked AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (
      PARTITION BY "venueId"
      ORDER BY "sortOrder" ASC, "createdAt" ASC, "id" ASC
    ) AS rn
  FROM "VenueImage"
  WHERE "isPrimary" = true
)
UPDATE "VenueImage" v
SET "isPrimary" = false
FROM ranked r
WHERE v."id" = r."id" AND r.rn > 1;

WITH ranked AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (
      PARTITION BY "artistId"
      ORDER BY "sortOrder" ASC, "createdAt" ASC, "id" ASC
    ) AS rn
  FROM "ArtistImage"
  WHERE "isPrimary" = true
)
UPDATE "ArtistImage" a
SET "isPrimary" = false
FROM ranked r
WHERE a."id" = r."id" AND r.rn > 1;

ALTER TABLE "EventImage"
  DROP CONSTRAINT IF EXISTS "EventImage_sortOrder_non_negative",
  ADD CONSTRAINT "EventImage_sortOrder_non_negative" CHECK ("sortOrder" >= 0);

ALTER TABLE "VenueImage"
  DROP CONSTRAINT IF EXISTS "VenueImage_sortOrder_non_negative",
  ADD CONSTRAINT "VenueImage_sortOrder_non_negative" CHECK ("sortOrder" >= 0);

ALTER TABLE "ArtistImage"
  DROP CONSTRAINT IF EXISTS "ArtistImage_sortOrder_non_negative",
  ADD CONSTRAINT "ArtistImage_sortOrder_non_negative" CHECK ("sortOrder" >= 0);

CREATE UNIQUE INDEX IF NOT EXISTS "event_image_one_primary_per_event"
  ON "EventImage" ("eventId")
  WHERE "isPrimary" = true;

CREATE UNIQUE INDEX IF NOT EXISTS "venue_image_one_primary_per_venue"
  ON "VenueImage" ("venueId")
  WHERE "isPrimary" = true;

CREATE UNIQUE INDEX IF NOT EXISTS "artist_image_one_primary_per_artist"
  ON "ArtistImage" ("artistId")
  WHERE "isPrimary" = true;
