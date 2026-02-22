ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'ARTWORK_VIEW_MILESTONE';

ALTER TABLE "Notification"
  ADD COLUMN "readAt" TIMESTAMP(3),
  ADD COLUMN "archivedAt" TIMESTAMP(3),
  ADD COLUMN "entityType" TEXT,
  ADD COLUMN "entityId" UUID;

ALTER TABLE "Notification"
  ALTER COLUMN "body" DROP NOT NULL;

CREATE INDEX IF NOT EXISTS "Notification_userId_readAt_idx" ON "Notification"("userId", "readAt");
CREATE INDEX IF NOT EXISTS "Notification_entityType_entityId_idx" ON "Notification"("entityType", "entityId");

DROP INDEX IF EXISTS "Notification_userId_createdAt_idx";
CREATE INDEX IF NOT EXISTS "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt" DESC);
