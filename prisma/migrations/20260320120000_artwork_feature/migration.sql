-- CreateTable
CREATE TABLE "Artwork" (
  "id" UUID NOT NULL,
  "artistId" UUID NOT NULL,
  "title" TEXT NOT NULL,
  "slug" TEXT,
  "description" TEXT,
  "year" INTEGER,
  "medium" TEXT,
  "dimensions" TEXT,
  "priceAmount" INTEGER,
  "currency" TEXT,
  "isPublished" BOOLEAN NOT NULL DEFAULT false,
  "featuredAssetId" UUID,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Artwork_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ArtworkImage" (
  "id" UUID NOT NULL,
  "artworkId" UUID NOT NULL,
  "assetId" UUID NOT NULL,
  "alt" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ArtworkImage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ArtworkVenue" (
  "id" UUID NOT NULL,
  "artworkId" UUID NOT NULL,
  "venueId" UUID NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ArtworkVenue_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ArtworkEvent" (
  "id" UUID NOT NULL,
  "artworkId" UUID NOT NULL,
  "eventId" UUID NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ArtworkEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Artwork_slug_key" ON "Artwork"("slug");
CREATE INDEX "Artwork_artistId_idx" ON "Artwork"("artistId");
CREATE INDEX "Artwork_isPublished_idx" ON "Artwork"("isPublished");
CREATE INDEX "Artwork_featuredAssetId_idx" ON "Artwork"("featuredAssetId");

CREATE UNIQUE INDEX "ArtworkImage_artworkId_assetId_key" ON "ArtworkImage"("artworkId", "assetId");
CREATE INDEX "ArtworkImage_artworkId_idx" ON "ArtworkImage"("artworkId");
CREATE INDEX "ArtworkImage_assetId_idx" ON "ArtworkImage"("assetId");
CREATE INDEX "ArtworkImage_artworkId_sortOrder_idx" ON "ArtworkImage"("artworkId", "sortOrder");

CREATE UNIQUE INDEX "ArtworkVenue_artworkId_venueId_key" ON "ArtworkVenue"("artworkId", "venueId");
CREATE INDEX "ArtworkVenue_artworkId_idx" ON "ArtworkVenue"("artworkId");
CREATE INDEX "ArtworkVenue_venueId_idx" ON "ArtworkVenue"("venueId");

CREATE UNIQUE INDEX "ArtworkEvent_artworkId_eventId_key" ON "ArtworkEvent"("artworkId", "eventId");
CREATE INDEX "ArtworkEvent_artworkId_idx" ON "ArtworkEvent"("artworkId");
CREATE INDEX "ArtworkEvent_eventId_idx" ON "ArtworkEvent"("eventId");

ALTER TABLE "Artwork" ADD CONSTRAINT "Artwork_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Artwork" ADD CONSTRAINT "Artwork_featuredAssetId_fkey" FOREIGN KEY ("featuredAssetId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ArtworkImage" ADD CONSTRAINT "ArtworkImage_artworkId_fkey" FOREIGN KEY ("artworkId") REFERENCES "Artwork"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ArtworkImage" ADD CONSTRAINT "ArtworkImage_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ArtworkVenue" ADD CONSTRAINT "ArtworkVenue_artworkId_fkey" FOREIGN KEY ("artworkId") REFERENCES "Artwork"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ArtworkVenue" ADD CONSTRAINT "ArtworkVenue_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ArtworkEvent" ADD CONSTRAINT "ArtworkEvent_artworkId_fkey" FOREIGN KEY ("artworkId") REFERENCES "Artwork"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ArtworkEvent" ADD CONSTRAINT "ArtworkEvent_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
