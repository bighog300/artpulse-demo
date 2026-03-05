ALTER TABLE "SiteSettings"
  ADD COLUMN "ingestSystemPrompt" TEXT,
  ADD COLUMN "ingestModel" TEXT,
  ADD COLUMN "ingestMaxOutputTokens" INTEGER;
