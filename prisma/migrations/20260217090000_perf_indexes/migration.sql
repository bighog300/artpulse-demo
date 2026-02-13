-- CreateIndex
CREATE INDEX "Follow_targetType_targetId_createdAt_idx" ON "Follow"("targetType", "targetId", "createdAt");

-- CreateIndex
CREATE INDEX "Event_isPublished_startAt_idx" ON "Event"("isPublished", "startAt");

-- CreateIndex
CREATE INDEX "Event_venueId_startAt_idx" ON "Event"("venueId", "startAt");

-- CreateIndex
CREATE INDEX "Event_publishedAt_idx" ON "Event"("publishedAt");

-- CreateIndex
CREATE INDEX "VenueMembership_venueId_role_idx" ON "VenueMembership"("venueId", "role");

-- CreateIndex
CREATE INDEX "Submission_type_status_idx" ON "Submission"("type", "status");

-- CreateIndex
CREATE INDEX "Submission_decidedAt_idx" ON "Submission"("decidedAt");

-- CreateIndex
CREATE INDEX "Submission_submitterUserId_createdAt_idx" ON "Submission"("submitterUserId", "createdAt");

-- DropIndex
DROP INDEX "Submission_submitterUserId_idx";

-- CreateIndex
CREATE INDEX "EventTag_tagId_idx" ON "EventTag"("tagId");

-- CreateIndex
CREATE INDEX "EventTag_eventId_idx" ON "EventTag"("eventId");

-- CreateIndex
CREATE INDEX "EventTag_tagId_eventId_idx" ON "EventTag"("tagId", "eventId");

-- CreateIndex
CREATE INDEX "EventArtist_artistId_idx" ON "EventArtist"("artistId");

-- CreateIndex
CREATE INDEX "EventArtist_eventId_idx" ON "EventArtist"("eventId");

-- CreateIndex
CREATE INDEX "EventArtist_artistId_eventId_idx" ON "EventArtist"("artistId", "eventId");
