-- CreateEnum
CREATE TYPE "EngagementSurface" AS ENUM ('DIGEST', 'NEARBY', 'SEARCH', 'FOLLOWING');

-- CreateEnum
CREATE TYPE "EngagementAction" AS ENUM ('VIEW', 'CLICK', 'FOLLOW', 'SAVE_SEARCH');

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

-- AddForeignKey
ALTER TABLE "EngagementEvent" ADD CONSTRAINT "EngagementEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "EngagementEvent_userId_createdAt_idx" ON "EngagementEvent"("userId", "createdAt");
CREATE INDEX "EngagementEvent_surface_createdAt_idx" ON "EngagementEvent"("surface", "createdAt");
CREATE INDEX "EngagementEvent_targetType_targetId_createdAt_idx" ON "EngagementEvent"("targetType", "targetId", "createdAt");
CREATE INDEX "EngagementEvent_userId_surface_createdAt_idx" ON "EngagementEvent"("userId", "surface", "createdAt");
