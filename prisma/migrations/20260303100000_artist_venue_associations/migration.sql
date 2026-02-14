-- CreateEnum
CREATE TYPE "ArtistVenueAssociationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "ArtistVenueAssociation" (
  "id" UUID NOT NULL,
  "artistId" UUID NOT NULL,
  "venueId" UUID NOT NULL,
  "role" TEXT,
  "status" "ArtistVenueAssociationStatus" NOT NULL DEFAULT 'PENDING',
  "message" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "requestedByUserId" UUID,
  "reviewedByUserId" UUID,
  "reviewedAt" TIMESTAMP(3),
  CONSTRAINT "ArtistVenueAssociation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ArtistVenueAssociation_artistId_venueId_key" ON "ArtistVenueAssociation"("artistId", "venueId");
CREATE INDEX "ArtistVenueAssociation_venueId_status_createdAt_idx" ON "ArtistVenueAssociation"("venueId", "status", "createdAt");
CREATE INDEX "ArtistVenueAssociation_artistId_status_createdAt_idx" ON "ArtistVenueAssociation"("artistId", "status", "createdAt");

-- AddForeignKey
ALTER TABLE "ArtistVenueAssociation" ADD CONSTRAINT "ArtistVenueAssociation_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ArtistVenueAssociation" ADD CONSTRAINT "ArtistVenueAssociation_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE CASCADE ON UPDATE CASCADE;
