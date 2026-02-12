-- CreateEnum
CREATE TYPE "AssetKind" AS ENUM ('IMAGE');

-- CreateTable
CREATE TABLE "Asset" (
    "id" UUID NOT NULL,
    "ownerUserId" UUID,
    "kind" "AssetKind" NOT NULL,
    "url" TEXT NOT NULL,
    "filename" TEXT,
    "mime" TEXT,
    "sizeBytes" INTEGER,
    "width" INTEGER,
    "height" INTEGER,
    "alt" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Artist" ADD COLUMN "featuredAssetId" UUID;

-- AlterTable
ALTER TABLE "EventImage" ADD COLUMN "assetId" UUID;

-- AlterTable
ALTER TABLE "Venue" ADD COLUMN "featuredAssetId" UUID,
ADD COLUMN "featuredImageUrl" TEXT;

-- CreateIndex
CREATE INDEX "Asset_ownerUserId_idx" ON "Asset"("ownerUserId");

-- CreateIndex
CREATE INDEX "Asset_createdAt_idx" ON "Asset"("createdAt");

-- CreateIndex
CREATE INDEX "Artist_featuredAssetId_idx" ON "Artist"("featuredAssetId");

-- CreateIndex
CREATE INDEX "EventImage_assetId_idx" ON "EventImage"("assetId");

-- CreateIndex
CREATE INDEX "Venue_featuredAssetId_idx" ON "Venue"("featuredAssetId");

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Venue" ADD CONSTRAINT "Venue_featuredAssetId_fkey" FOREIGN KEY ("featuredAssetId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Artist" ADD CONSTRAINT "Artist_featuredAssetId_fkey" FOREIGN KEY ("featuredAssetId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventImage" ADD CONSTRAINT "EventImage_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
