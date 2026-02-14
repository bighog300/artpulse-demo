-- AlterEnum
CREATE TYPE "SubmissionKind" AS ENUM ('PUBLISH', 'REVISION');

-- AlterTable
ALTER TABLE "Submission" ADD COLUMN "details" JSONB,
ADD COLUMN "kind" "SubmissionKind";

-- DropIndex
DROP INDEX "Submission_targetEventId_key";

-- CreateIndex
CREATE INDEX "Submission_targetEventId_idx" ON "Submission"("targetEventId");
