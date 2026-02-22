CREATE TABLE "ArtistFeaturedArtwork" (
  "id" UUID NOT NULL,
  "artistId" UUID NOT NULL,
  "artworkId" UUID NOT NULL,
  "sortOrder" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ArtistFeaturedArtwork_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CuratedCollection" (
  "id" UUID NOT NULL,
  "slug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "isPublished" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CuratedCollection_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CuratedCollectionItem" (
  "id" UUID NOT NULL,
  "collectionId" UUID NOT NULL,
  "artworkId" UUID NOT NULL,
  "sortOrder" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "CuratedCollectionItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ArtistFeaturedArtwork_artistId_artworkId_key" ON "ArtistFeaturedArtwork"("artistId", "artworkId");
CREATE INDEX "ArtistFeaturedArtwork_artistId_sortOrder_idx" ON "ArtistFeaturedArtwork"("artistId", "sortOrder");

CREATE UNIQUE INDEX "CuratedCollection_slug_key" ON "CuratedCollection"("slug");
CREATE INDEX "CuratedCollection_isPublished_idx" ON "CuratedCollection"("isPublished");

CREATE UNIQUE INDEX "CuratedCollectionItem_collectionId_artworkId_key" ON "CuratedCollectionItem"("collectionId", "artworkId");
CREATE INDEX "CuratedCollectionItem_collectionId_sortOrder_idx" ON "CuratedCollectionItem"("collectionId", "sortOrder");

ALTER TABLE "ArtistFeaturedArtwork"
ADD CONSTRAINT "ArtistFeaturedArtwork_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ArtistFeaturedArtwork"
ADD CONSTRAINT "ArtistFeaturedArtwork_artworkId_fkey" FOREIGN KEY ("artworkId") REFERENCES "Artwork"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CuratedCollectionItem"
ADD CONSTRAINT "CuratedCollectionItem_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "CuratedCollection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CuratedCollectionItem"
ADD CONSTRAINT "CuratedCollectionItem_artworkId_fkey" FOREIGN KEY ("artworkId") REFERENCES "Artwork"("id") ON DELETE CASCADE ON UPDATE CASCADE;
