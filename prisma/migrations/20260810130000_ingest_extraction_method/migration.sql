ALTER TABLE "IngestRun"
  ADD COLUMN IF NOT EXISTS "extractionMethod" TEXT;
