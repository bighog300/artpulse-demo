-- AlterTable
ALTER TABLE "User"
ADD COLUMN "locationLabel" TEXT,
ADD COLUMN "locationLat" DOUBLE PRECISION,
ADD COLUMN "locationLng" DOUBLE PRECISION,
ADD COLUMN "locationRadiusKm" INTEGER NOT NULL DEFAULT 25;

-- CreateIndex
CREATE INDEX "User_locationLat_locationLng_idx" ON "User"("locationLat", "locationLng");
