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

-- AddForeignKey
ALTER TABLE "DigestRun" ADD CONSTRAINT "DigestRun_savedSearchId_fkey" FOREIGN KEY ("savedSearchId") REFERENCES "SavedSearch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DigestRun" ADD CONSTRAINT "DigestRun_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex / Unique
CREATE UNIQUE INDEX "DigestRun_savedSearchId_periodKey_key" ON "DigestRun"("savedSearchId", "periodKey");
CREATE INDEX "DigestRun_userId_createdAt_idx" ON "DigestRun"("userId", "createdAt");
CREATE INDEX "DigestRun_savedSearchId_createdAt_idx" ON "DigestRun"("savedSearchId", "createdAt");
CREATE INDEX "DigestRun_periodKey_idx" ON "DigestRun"("periodKey");
