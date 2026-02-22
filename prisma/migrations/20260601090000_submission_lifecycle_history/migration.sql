-- Allow multiple venue submission attempts and optimize latest-submission lookups.
DROP INDEX IF EXISTS "Submission_targetVenueId_key";

CREATE INDEX IF NOT EXISTS "Submission_targetVenueId_createdAt_idx"
  ON "Submission"("targetVenueId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "Submission_targetEventId_createdAt_idx"
  ON "Submission"("targetEventId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "Submission_targetArtistId_createdAt_idx"
  ON "Submission"("targetArtistId", "createdAt" DESC);
