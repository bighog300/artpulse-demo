DO $$
BEGIN
  IF to_regclass('public."Event"') IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'EventType') THEN
    CREATE TYPE "EventType" AS ENUM (
      'EXHIBITION',
      'FAIR',
      'OPENING',
      'WORKSHOP',
      'TALK',
      'SCREENING',
      'RESIDENCY',
      'OTHER'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'EventType') THEN
    ALTER TYPE "EventType" ADD VALUE IF NOT EXISTS 'SCREENING';
    ALTER TYPE "EventType" ADD VALUE IF NOT EXISTS 'RESIDENCY';
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public."Event"') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'Event'
         AND column_name = 'eventType'
     ) THEN
    ALTER TABLE "Event" ADD COLUMN "eventType" "EventType";
  END IF;
END $$;
