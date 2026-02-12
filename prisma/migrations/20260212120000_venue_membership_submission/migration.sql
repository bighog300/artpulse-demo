-- Create enums for ownership/submission workflow
CREATE TYPE "VenueMembershipRole" AS ENUM ('OWNER', 'EDITOR');
CREATE TYPE "SubmissionType" AS ENUM ('EVENT', 'VENUE');
CREATE TYPE "SubmissionStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED');

-- Create venue memberships
CREATE TABLE "VenueMembership" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "venueId" UUID NOT NULL,
  "role" "VenueMembershipRole" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "VenueMembership_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "VenueMembership_userId_venueId_key" ON "VenueMembership"("userId", "venueId");
CREATE INDEX "VenueMembership_venueId_idx" ON "VenueMembership"("venueId");
CREATE INDEX "VenueMembership_userId_idx" ON "VenueMembership"("userId");

-- Create submissions for moderation audit trail
CREATE TABLE "Submission" (
  "id" UUID NOT NULL,
  "type" "SubmissionType" NOT NULL,
  "status" "SubmissionStatus" NOT NULL DEFAULT 'DRAFT',
  "submitterUserId" UUID NOT NULL,
  "venueId" UUID,
  "targetEventId" UUID,
  "targetVenueId" UUID,
  "note" TEXT,
  "decisionReason" TEXT,
  "decidedByUserId" UUID,
  "submittedAt" TIMESTAMP(3),
  "decidedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Submission_targetEventId_key" ON "Submission"("targetEventId");
CREATE UNIQUE INDEX "Submission_targetVenueId_key" ON "Submission"("targetVenueId");
CREATE INDEX "Submission_status_submittedAt_idx" ON "Submission"("status", "submittedAt");
CREATE INDEX "Submission_submitterUserId_idx" ON "Submission"("submitterUserId");

ALTER TABLE "VenueMembership"
  ADD CONSTRAINT "VenueMembership_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "VenueMembership"
  ADD CONSTRAINT "VenueMembership_venueId_fkey"
  FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Submission"
  ADD CONSTRAINT "Submission_submitterUserId_fkey"
  FOREIGN KEY ("submitterUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Submission"
  ADD CONSTRAINT "Submission_venueId_fkey"
  FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Submission"
  ADD CONSTRAINT "Submission_targetEventId_fkey"
  FOREIGN KEY ("targetEventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Submission"
  ADD CONSTRAINT "Submission_targetVenueId_fkey"
  FOREIGN KEY ("targetVenueId") REFERENCES "Venue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Submission"
  ADD CONSTRAINT "Submission_decidedByUserId_fkey"
  FOREIGN KEY ("decidedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
