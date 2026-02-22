ALTER TABLE "CuratedCollection"
ADD COLUMN "publishStartsAt" TIMESTAMP(3),
ADD COLUMN "publishEndsAt" TIMESTAMP(3),
ADD COLUMN "homeRank" INTEGER,
ADD COLUMN "showOnHome" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "showOnArtwork" BOOLEAN NOT NULL DEFAULT true;

DROP INDEX IF EXISTS "CuratedCollection_isPublished_idx";
CREATE INDEX "CuratedCollection_isPublished_publishStartsAt_publishEndsAt_idx" ON "CuratedCollection"("isPublished", "publishStartsAt", "publishEndsAt");
CREATE INDEX "CuratedCollection_homeRank_idx" ON "CuratedCollection"("homeRank");
CREATE INDEX "CuratedCollection_updatedAt_idx" ON "CuratedCollection"("updatedAt");
