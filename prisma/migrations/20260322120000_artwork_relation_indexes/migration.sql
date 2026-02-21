CREATE INDEX "Artwork_artistId_isPublished_updatedAt_idx" ON "Artwork"("artistId", "isPublished", "updatedAt");
CREATE INDEX "ArtworkVenue_venueId_artworkId_idx" ON "ArtworkVenue"("venueId", "artworkId");
CREATE INDEX "ArtworkEvent_eventId_artworkId_idx" ON "ArtworkEvent"("eventId", "artworkId");
