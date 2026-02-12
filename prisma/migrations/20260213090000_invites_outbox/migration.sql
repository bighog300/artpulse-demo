CREATE TYPE "VenueInviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REVOKED', 'EXPIRED');
CREATE TYPE "NotificationType" AS ENUM ('SUBMISSION_SUBMITTED', 'SUBMISSION_APPROVED', 'SUBMISSION_REJECTED', 'INVITE_CREATED');
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

CREATE TABLE "VenueInvite" (
  "id" UUID NOT NULL,
  "venueId" UUID NOT NULL,
  "email" TEXT NOT NULL,
  "role" "VenueMembershipRole" NOT NULL,
  "token" TEXT NOT NULL,
  "status" "VenueInviteStatus" NOT NULL DEFAULT 'PENDING',
  "invitedByUserId" UUID NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "acceptedAt" TIMESTAMP(3),
  CONSTRAINT "VenueInvite_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "VenueInvite_token_key" ON "VenueInvite"("token");
CREATE INDEX "VenueInvite_venueId_status_idx" ON "VenueInvite"("venueId", "status");
CREATE INDEX "VenueInvite_email_status_idx" ON "VenueInvite"("email", "status");

CREATE TABLE "NotificationOutbox" (
  "id" UUID NOT NULL,
  "type" "NotificationType" NOT NULL,
  "toEmail" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "dedupeKey" TEXT NOT NULL,
  "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "sentAt" TIMESTAMP(3),
  "errorMessage" TEXT,
  CONSTRAINT "NotificationOutbox_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "NotificationOutbox_dedupeKey_key" ON "NotificationOutbox"("dedupeKey");
CREATE INDEX "NotificationOutbox_status_createdAt_idx" ON "NotificationOutbox"("status", "createdAt");

ALTER TABLE "VenueInvite"
  ADD CONSTRAINT "VenueInvite_venueId_fkey"
  FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "VenueInvite"
  ADD CONSTRAINT "VenueInvite_invitedByUserId_fkey"
  FOREIGN KEY ("invitedByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
