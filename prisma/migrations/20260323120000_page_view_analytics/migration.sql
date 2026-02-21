-- CreateEnum
CREATE TYPE "AnalyticsEntityType" AS ENUM ('ARTWORK', 'ARTIST', 'VENUE', 'EVENT');

-- CreateTable
CREATE TABLE "PageViewEvent" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "entityType" "AnalyticsEntityType" NOT NULL,
    "entityId" UUID NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "day" DATE NOT NULL,
    "viewerHash" TEXT,
    "userId" UUID,

    CONSTRAINT "PageViewEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PageViewDaily" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "entityType" "AnalyticsEntityType" NOT NULL,
    "entityId" UUID NOT NULL,
    "day" DATE NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PageViewDaily_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PageViewEvent_entityType_entityId_occurredAt_idx" ON "PageViewEvent"("entityType", "entityId", "occurredAt");

-- CreateIndex
CREATE INDEX "PageViewEvent_day_entityType_idx" ON "PageViewEvent"("day", "entityType");

-- CreateIndex
CREATE INDEX "PageViewEvent_entityType_entityId_day_idx" ON "PageViewEvent"("entityType", "entityId", "day");

-- CreateIndex
CREATE INDEX "PageViewEvent_userId_occurredAt_idx" ON "PageViewEvent"("userId", "occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "PageViewDaily_entityType_entityId_day_key" ON "PageViewDaily"("entityType", "entityId", "day");

-- CreateIndex
CREATE INDEX "PageViewDaily_entityType_entityId_day_idx" ON "PageViewDaily"("entityType", "entityId", "day");

-- CreateIndex
CREATE INDEX "PageViewDaily_day_entityType_idx" ON "PageViewDaily"("day", "entityType");

-- AddForeignKey
ALTER TABLE "PageViewEvent" ADD CONSTRAINT "PageViewEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
