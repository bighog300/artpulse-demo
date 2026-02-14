-- CreateTable
CREATE TABLE "VenueImage" (
    "id" UUID NOT NULL,
    "venueId" UUID NOT NULL,
    "assetId" UUID,
    "url" TEXT NOT NULL,
    "alt" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VenueImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VenueImage_assetId_idx" ON "VenueImage"("assetId");

-- CreateIndex
CREATE INDEX "VenueImage_venueId_sortOrder_idx" ON "VenueImage"("venueId", "sortOrder");

-- AddForeignKey
ALTER TABLE "VenueImage" ADD CONSTRAINT "VenueImage_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VenueImage" ADD CONSTRAINT "VenueImage_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
