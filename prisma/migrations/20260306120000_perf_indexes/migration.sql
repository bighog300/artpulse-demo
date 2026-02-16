CREATE INDEX "Event_isPublished_startAt_id_idx" ON "Event"("isPublished", "startAt", "id");

CREATE INDEX "EventArtist_artistId_eventId_idx" ON "EventArtist"("artistId", "eventId");

CREATE INDEX "EventImage_eventId_sortOrder_idx" ON "EventImage"("eventId", "sortOrder");

CREATE INDEX "Favorite_targetType_targetId_idx" ON "Favorite"("targetType", "targetId");

CREATE INDEX "Favorite_targetType_createdAt_targetId_idx" ON "Favorite"("targetType", "createdAt", "targetId");
