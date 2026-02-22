-- CreateEnum
CREATE TYPE "EditorialNotificationKind" AS ENUM (
  'COLLECTION_GOES_LIVE_SOON',
  'COLLECTION_EXPIRES_SOON',
  'COLLECTION_QA_ISSUES',
  'RANK_COLLISION_ALERT'
);

-- CreateTable
CREATE TABLE "EditorialNotificationLog" (
  "id" UUID NOT NULL,
  "kind" "EditorialNotificationKind" NOT NULL,
  "fingerprint" TEXT NOT NULL,
  "payloadJson" JSONB NOT NULL,
  "sentTo" TEXT[] NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "EditorialNotificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EditorialNotificationLog_fingerprint_key" ON "EditorialNotificationLog"("fingerprint");
