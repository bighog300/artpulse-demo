-- CreateEnum
CREATE TYPE "SavedSearchType" AS ENUM ('NEARBY', 'EVENTS_FILTER');

-- CreateEnum
CREATE TYPE "DigestFrequency" AS ENUM ('WEEKLY');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'DIGEST_READY';

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

-- AddForeignKey
ALTER TABLE "SavedSearch" ADD CONSTRAINT "SavedSearch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "SavedSearch_userId_createdAt_idx" ON "SavedSearch"("userId", "createdAt");
CREATE INDEX "SavedSearch_isEnabled_frequency_lastSentAt_idx" ON "SavedSearch"("isEnabled", "frequency", "lastSentAt");
