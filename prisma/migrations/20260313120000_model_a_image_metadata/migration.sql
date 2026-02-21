ALTER TABLE "EventImage"
  ADD COLUMN "width" INTEGER,
  ADD COLUMN "height" INTEGER,
  ADD COLUMN "contentType" TEXT,
  ADD COLUMN "sizeBytes" INTEGER;

ALTER TABLE "VenueImage"
  ADD COLUMN "width" INTEGER,
  ADD COLUMN "height" INTEGER,
  ADD COLUMN "contentType" TEXT,
  ADD COLUMN "sizeBytes" INTEGER;

ALTER TABLE "ArtistImage"
  ADD COLUMN "width" INTEGER,
  ADD COLUMN "height" INTEGER,
  ADD COLUMN "contentType" TEXT,
  ADD COLUMN "sizeBytes" INTEGER;
