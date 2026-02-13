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

-- CreateIndex
CREATE INDEX "PerfSnapshot_name_createdAt_idx" ON "PerfSnapshot"("name", "createdAt");

-- CreateIndex
CREATE INDEX "PerfSnapshot_createdByUserId_idx" ON "PerfSnapshot"("createdByUserId");

-- AddForeignKey
ALTER TABLE "PerfSnapshot" ADD CONSTRAINT "PerfSnapshot_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
