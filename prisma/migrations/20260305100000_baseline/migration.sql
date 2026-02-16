-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'EDITOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "VenueMembershipRole" AS ENUM ('OWNER', 'EDITOR');

-- CreateEnum
CREATE TYPE "VenueInviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REVOKED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "SubmissionType" AS ENUM ('EVENT', 'VENUE', 'ARTIST');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "SubmissionKind" AS ENUM ('PUBLISH', 'REVISION');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('SUBMISSION_SUBMITTED', 'SUBMISSION_APPROVED', 'SUBMISSION_REJECTED', 'INVITE_CREATED', 'DIGEST_READY');

-- CreateEnum
CREATE TYPE "ArtistVenueAssociationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "SavedSearchType" AS ENUM ('NEARBY', 'EVENTS_FILTER');

-- CreateEnum
CREATE TYPE "DigestFrequency" AS ENUM ('WEEKLY');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'PROCESSING', 'SENT', 'FAILED');

-- CreateEnum
CREATE TYPE "NotificationInboxStatus" AS ENUM ('UNREAD', 'READ');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('EXHIBITION', 'OPENING', 'TALK', 'WORKSHOP', 'FAIR', 'OTHER');

-- CreateEnum
CREATE TYPE "FavoriteTargetType" AS ENUM ('EVENT', 'VENUE', 'ARTIST');

-- CreateEnum
CREATE TYPE "FollowTargetType" AS ENUM ('ARTIST', 'VENUE');

-- CreateEnum
CREATE TYPE "EngagementSurface" AS ENUM ('DIGEST', 'NEARBY', 'SEARCH', 'FOLLOWING');

-- CreateEnum
CREATE TYPE "EngagementAction" AS ENUM ('VIEW', 'CLICK', 'FOLLOW', 'SAVE_SEARCH');

-- CreateEnum
CREATE TYPE "AssetKind" AS ENUM ('IMAGE');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "imageUrl" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "locationLabel" TEXT,
    "locationLat" DOUBLE PRECISION,
    "locationLng" DOUBLE PRECISION,
    "locationRadiusKm" INTEGER NOT NULL DEFAULT 25,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EngagementEvent" (
    "id" UUID NOT NULL,
    "userId" UUID,
    "sessionId" TEXT,
    "surface" "EngagementSurface" NOT NULL,
    "action" "EngagementAction" NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "metaJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EngagementEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OnboardingState" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "completedAt" TIMESTAMP(3),
    "hasFollowedSomething" BOOLEAN NOT NULL DEFAULT false,
    "hasVisitedFollowing" BOOLEAN NOT NULL DEFAULT false,
    "hasAcceptedInvite" BOOLEAN NOT NULL DEFAULT false,
    "hasCreatedVenue" BOOLEAN NOT NULL DEFAULT false,
    "hasSubmittedEvent" BOOLEAN NOT NULL DEFAULT false,
    "hasViewedNotifications" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OnboardingState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerfSnapshot" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdByUserId" UUID,
    "paramsJson" JSONB NOT NULL,
    "explainText" TEXT NOT NULL,
    "durationMs" INTEGER,

    CONSTRAINT "PerfSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Venue" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "city" TEXT,
    "region" TEXT,
    "country" TEXT,
    "postcode" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "websiteUrl" TEXT,
    "instagramUrl" TEXT,
    "contactEmail" TEXT,
    "featuredImageUrl" TEXT,
    "featuredAssetId" UUID,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Venue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Artist" (
    "id" UUID NOT NULL,
    "userId" UUID,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "bio" TEXT,
    "websiteUrl" TEXT,
    "instagramUrl" TEXT,
    "avatarImageUrl" TEXT,
    "featuredImageUrl" TEXT,
    "featuredAssetId" UUID,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Artist_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "Event" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3),
    "timezone" TEXT NOT NULL,
    "eventType" "EventType",
    "ticketUrl" TEXT,
    "priceText" TEXT,
    "isFree" BOOLEAN,
    "organizerName" TEXT,
    "venueId" UUID,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VenueMembership" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "venueId" UUID NOT NULL,
    "role" "VenueMembershipRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VenueMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Submission" (
    "id" UUID NOT NULL,
    "type" "SubmissionType" NOT NULL,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'DRAFT',
    "kind" "SubmissionKind",
    "submitterUserId" UUID NOT NULL,
    "venueId" UUID,
    "targetEventId" UUID,
    "targetVenueId" UUID,
    "targetArtistId" UUID,
    "note" TEXT,
    "details" JSONB,
    "decisionReason" TEXT,
    "decidedByUserId" UUID,
    "submittedAt" TIMESTAMP(3),
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
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

-- CreateTable
CREATE TABLE "Notification" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "href" TEXT,
    "dedupeKey" TEXT NOT NULL,
    "status" "NotificationInboxStatus" NOT NULL DEFAULT 'UNREAD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedSearch" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" "SavedSearchType" NOT NULL,
    "name" TEXT NOT NULL,
    "paramsJson" JSONB NOT NULL,
    "frequency" "DigestFrequency" NOT NULL DEFAULT 'WEEKLY',
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "lastSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavedSearch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DigestRun" (
    "id" UUID NOT NULL,
    "savedSearchId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "periodKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "itemCount" INTEGER NOT NULL,
    "itemsJson" JSONB NOT NULL,

    CONSTRAINT "DigestRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventTag" (
    "eventId" UUID NOT NULL,
    "tagId" UUID NOT NULL,

    CONSTRAINT "EventTag_pkey" PRIMARY KEY ("eventId","tagId")
);

-- CreateTable
CREATE TABLE "EventArtist" (
    "eventId" UUID NOT NULL,
    "artistId" UUID NOT NULL,
    "role" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventArtist_pkey" PRIMARY KEY ("eventId","artistId")
);

-- CreateTable
CREATE TABLE "ArtistImage" (
    "id" UUID NOT NULL,
    "artistId" UUID NOT NULL,
    "assetId" UUID,
    "url" TEXT NOT NULL,
    "alt" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArtistImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventImage" (
    "id" UUID NOT NULL,
    "eventId" UUID NOT NULL,
    "assetId" UUID,
    "url" TEXT NOT NULL,
    "alt" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VenueImage" (
    "id" UUID NOT NULL,
    "venueId" UUID NOT NULL,
    "assetId" UUID,
    "url" TEXT NOT NULL,
    "alt" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VenueImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" UUID NOT NULL,
    "ownerUserId" UUID,
    "kind" "AssetKind" NOT NULL,
    "url" TEXT NOT NULL,
    "filename" TEXT,
    "mime" TEXT,
    "sizeBytes" INTEGER,
    "width" INTEGER,
    "height" INTEGER,
    "alt" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Favorite" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "targetType" "FavoriteTargetType" NOT NULL,
    "targetId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Follow" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "targetType" "FollowTargetType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Follow_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_locationLat_locationLng_idx" ON "User"("locationLat", "locationLng");

-- CreateIndex
CREATE INDEX "EngagementEvent_userId_createdAt_idx" ON "EngagementEvent"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "EngagementEvent_surface_createdAt_idx" ON "EngagementEvent"("surface", "createdAt");

-- CreateIndex
CREATE INDEX "EngagementEvent_targetType_targetId_createdAt_idx" ON "EngagementEvent"("targetType", "targetId", "createdAt");

-- CreateIndex
CREATE INDEX "EngagementEvent_userId_surface_createdAt_idx" ON "EngagementEvent"("userId", "surface", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "OnboardingState_userId_key" ON "OnboardingState"("userId");

-- CreateIndex
CREATE INDEX "PerfSnapshot_name_createdAt_idx" ON "PerfSnapshot"("name", "createdAt");

-- CreateIndex
CREATE INDEX "PerfSnapshot_createdByUserId_idx" ON "PerfSnapshot"("createdByUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Venue_slug_key" ON "Venue"("slug");

-- CreateIndex
CREATE INDEX "Venue_isPublished_idx" ON "Venue"("isPublished");

-- CreateIndex
CREATE INDEX "Venue_featuredAssetId_idx" ON "Venue"("featuredAssetId");

-- CreateIndex
CREATE UNIQUE INDEX "Artist_userId_key" ON "Artist"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Artist_slug_key" ON "Artist"("slug");

-- CreateIndex
CREATE INDEX "Artist_isPublished_idx" ON "Artist"("isPublished");

-- CreateIndex
CREATE INDEX "Artist_featuredAssetId_idx" ON "Artist"("featuredAssetId");

-- CreateIndex
CREATE INDEX "ArtistVenueAssociation_venueId_status_createdAt_idx" ON "ArtistVenueAssociation"("venueId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "ArtistVenueAssociation_artistId_status_createdAt_idx" ON "ArtistVenueAssociation"("artistId", "status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ArtistVenueAssociation_artistId_venueId_key" ON "ArtistVenueAssociation"("artistId", "venueId");

-- CreateIndex
CREATE UNIQUE INDEX "Event_slug_key" ON "Event"("slug");

-- CreateIndex
CREATE INDEX "Event_startAt_idx" ON "Event"("startAt");

-- CreateIndex
CREATE INDEX "Event_isPublished_idx" ON "Event"("isPublished");

-- CreateIndex
CREATE INDEX "Event_venueId_idx" ON "Event"("venueId");

-- CreateIndex
CREATE INDEX "Event_isPublished_startAt_idx" ON "Event"("isPublished", "startAt");

-- CreateIndex
CREATE INDEX "Event_venueId_startAt_idx" ON "Event"("venueId", "startAt");

-- CreateIndex
CREATE INDEX "Event_publishedAt_idx" ON "Event"("publishedAt");

-- CreateIndex
CREATE INDEX "VenueMembership_venueId_idx" ON "VenueMembership"("venueId");

-- CreateIndex
CREATE INDEX "VenueMembership_userId_idx" ON "VenueMembership"("userId");

-- CreateIndex
CREATE INDEX "VenueMembership_venueId_role_idx" ON "VenueMembership"("venueId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "VenueMembership_userId_venueId_key" ON "VenueMembership"("userId", "venueId");

-- CreateIndex
CREATE INDEX "Submission_targetEventId_idx" ON "Submission"("targetEventId");

-- CreateIndex
CREATE INDEX "Submission_targetArtistId_idx" ON "Submission"("targetArtistId");

-- CreateIndex
CREATE INDEX "Submission_status_submittedAt_idx" ON "Submission"("status", "submittedAt");

-- CreateIndex
CREATE INDEX "Submission_type_status_idx" ON "Submission"("type", "status");

-- CreateIndex
CREATE INDEX "Submission_decidedAt_idx" ON "Submission"("decidedAt");

-- CreateIndex
CREATE INDEX "Submission_submitterUserId_createdAt_idx" ON "Submission"("submitterUserId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Submission_targetVenueId_key" ON "Submission"("targetVenueId");

-- CreateIndex
CREATE UNIQUE INDEX "VenueInvite_token_key" ON "VenueInvite"("token");

-- CreateIndex
CREATE INDEX "VenueInvite_venueId_status_idx" ON "VenueInvite"("venueId", "status");

-- CreateIndex
CREATE INDEX "VenueInvite_email_status_idx" ON "VenueInvite"("email", "status");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationOutbox_dedupeKey_key" ON "NotificationOutbox"("dedupeKey");

-- CreateIndex
CREATE INDEX "NotificationOutbox_status_createdAt_idx" ON "NotificationOutbox"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Notification_dedupeKey_key" ON "Notification"("dedupeKey");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_status_idx" ON "Notification"("userId", "status");

-- CreateIndex
CREATE INDEX "SavedSearch_userId_createdAt_idx" ON "SavedSearch"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "SavedSearch_isEnabled_frequency_lastSentAt_idx" ON "SavedSearch"("isEnabled", "frequency", "lastSentAt");

-- CreateIndex
CREATE INDEX "DigestRun_userId_createdAt_idx" ON "DigestRun"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "DigestRun_savedSearchId_createdAt_idx" ON "DigestRun"("savedSearchId", "createdAt");

-- CreateIndex
CREATE INDEX "DigestRun_periodKey_idx" ON "DigestRun"("periodKey");

-- CreateIndex
CREATE UNIQUE INDEX "DigestRun_savedSearchId_periodKey_key" ON "DigestRun"("savedSearchId", "periodKey");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_slug_key" ON "Tag"("slug");

-- CreateIndex
CREATE INDEX "EventTag_tagId_idx" ON "EventTag"("tagId");

-- CreateIndex
CREATE INDEX "EventTag_eventId_idx" ON "EventTag"("eventId");

-- CreateIndex
CREATE INDEX "EventTag_tagId_eventId_idx" ON "EventTag"("tagId", "eventId");

-- CreateIndex
CREATE INDEX "EventArtist_artistId_sortOrder_idx" ON "EventArtist"("artistId", "sortOrder");

-- CreateIndex
CREATE INDEX "EventArtist_eventId_sortOrder_idx" ON "EventArtist"("eventId", "sortOrder");

-- CreateIndex
CREATE INDEX "ArtistImage_artistId_sortOrder_idx" ON "ArtistImage"("artistId", "sortOrder");

-- CreateIndex
CREATE INDEX "ArtistImage_assetId_idx" ON "ArtistImage"("assetId");

-- CreateIndex
CREATE INDEX "EventImage_assetId_idx" ON "EventImage"("assetId");

-- CreateIndex
CREATE INDEX "VenueImage_assetId_idx" ON "VenueImage"("assetId");

-- CreateIndex
CREATE INDEX "VenueImage_venueId_sortOrder_idx" ON "VenueImage"("venueId", "sortOrder");

-- CreateIndex
CREATE INDEX "Asset_ownerUserId_idx" ON "Asset"("ownerUserId");

-- CreateIndex
CREATE INDEX "Asset_createdAt_idx" ON "Asset"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_userId_targetType_targetId_key" ON "Favorite"("userId", "targetType", "targetId");

-- CreateIndex
CREATE INDEX "Follow_userId_createdAt_idx" ON "Follow"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Follow_targetType_targetId_idx" ON "Follow"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "Follow_targetType_targetId_createdAt_idx" ON "Follow"("targetType", "targetId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Follow_userId_targetType_targetId_key" ON "Follow"("userId", "targetType", "targetId");

-- AddForeignKey
ALTER TABLE "EngagementEvent" ADD CONSTRAINT "EngagementEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnboardingState" ADD CONSTRAINT "OnboardingState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerfSnapshot" ADD CONSTRAINT "PerfSnapshot_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Venue" ADD CONSTRAINT "Venue_featuredAssetId_fkey" FOREIGN KEY ("featuredAssetId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Artist" ADD CONSTRAINT "Artist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Artist" ADD CONSTRAINT "Artist_featuredAssetId_fkey" FOREIGN KEY ("featuredAssetId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArtistVenueAssociation" ADD CONSTRAINT "ArtistVenueAssociation_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArtistVenueAssociation" ADD CONSTRAINT "ArtistVenueAssociation_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VenueMembership" ADD CONSTRAINT "VenueMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VenueMembership" ADD CONSTRAINT "VenueMembership_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_submitterUserId_fkey" FOREIGN KEY ("submitterUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_targetEventId_fkey" FOREIGN KEY ("targetEventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_targetVenueId_fkey" FOREIGN KEY ("targetVenueId") REFERENCES "Venue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_targetArtistId_fkey" FOREIGN KEY ("targetArtistId") REFERENCES "Artist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_decidedByUserId_fkey" FOREIGN KEY ("decidedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VenueInvite" ADD CONSTRAINT "VenueInvite_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VenueInvite" ADD CONSTRAINT "VenueInvite_invitedByUserId_fkey" FOREIGN KEY ("invitedByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedSearch" ADD CONSTRAINT "SavedSearch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DigestRun" ADD CONSTRAINT "DigestRun_savedSearchId_fkey" FOREIGN KEY ("savedSearchId") REFERENCES "SavedSearch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DigestRun" ADD CONSTRAINT "DigestRun_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventTag" ADD CONSTRAINT "EventTag_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventTag" ADD CONSTRAINT "EventTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventArtist" ADD CONSTRAINT "EventArtist_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventArtist" ADD CONSTRAINT "EventArtist_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArtistImage" ADD CONSTRAINT "ArtistImage_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArtistImage" ADD CONSTRAINT "ArtistImage_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventImage" ADD CONSTRAINT "EventImage_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventImage" ADD CONSTRAINT "EventImage_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VenueImage" ADD CONSTRAINT "VenueImage_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VenueImage" ADD CONSTRAINT "VenueImage_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

