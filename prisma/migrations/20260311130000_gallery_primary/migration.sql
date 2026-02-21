ALTER TABLE "EventImage"
  ADD COLUMN "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "VenueImage"
  ADD COLUMN "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "ArtistImage"
  ADD COLUMN "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX "EventImage_eventId_isPrimary_idx" ON "EventImage"("eventId", "isPrimary");
CREATE INDEX "VenueImage_venueId_isPrimary_idx" ON "VenueImage"("venueId", "isPrimary");
CREATE INDEX "ArtistImage_artistId_isPrimary_idx" ON "ArtistImage"("artistId", "isPrimary");
