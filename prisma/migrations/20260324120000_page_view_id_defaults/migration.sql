-- Ensure UUID generation function is available
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Align analytics table UUID defaults with Prisma schema
ALTER TABLE "PageViewDaily" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "PageViewEvent" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
