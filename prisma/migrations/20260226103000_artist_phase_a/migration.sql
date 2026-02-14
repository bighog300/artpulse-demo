-- AlterTable
ALTER TABLE "EventArtist"
ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- DropIndex
DROP INDEX IF EXISTS "EventArtist_artistId_idx";
DROP INDEX IF EXISTS "EventArtist_eventId_idx";
DROP INDEX IF EXISTS "EventArtist_artistId_eventId_idx";

-- CreateTable
CREATE TABLE "ArtistImage" (
    "id" UUID NOT NULL,
    "artistId" UUID NOT NULL,
    "assetId" UUID,
    "url" TEXT NOT NULL,
    "alt" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArtistImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EventArtist_artistId_sortOrder_idx" ON "EventArtist"("artistId", "sortOrder");

-- CreateIndex
CREATE INDEX "EventArtist_eventId_sortOrder_idx" ON "EventArtist"("eventId", "sortOrder");

-- CreateIndex
CREATE INDEX "ArtistImage_artistId_sortOrder_idx" ON "ArtistImage"("artistId", "sortOrder");

-- CreateIndex
CREATE INDEX "ArtistImage_assetId_idx" ON "ArtistImage"("assetId");

-- AddForeignKey
ALTER TABLE "ArtistImage" ADD CONSTRAINT "ArtistImage_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArtistImage" ADD CONSTRAINT "ArtistImage_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
