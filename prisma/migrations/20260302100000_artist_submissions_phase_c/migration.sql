-- AlterEnum
ALTER TYPE "SubmissionType" ADD VALUE 'ARTIST';

-- AlterTable
ALTER TABLE "Submission" ADD COLUMN "targetArtistId" UUID;

-- CreateIndex
CREATE INDEX "Submission_targetArtistId_idx" ON "Submission"("targetArtistId");

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_targetArtistId_fkey" FOREIGN KEY ("targetArtistId") REFERENCES "Artist"("id") ON DELETE CASCADE ON UPDATE CASCADE;
