import { z } from "zod";

const followingFeedParamsSchema = z.object({
  days: z.coerce.number().int().min(1).max(90).default(30),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

const eventsListParamsSchema = z.object({
  days: z.coerce.number().int().min(1).max(180).default(30),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

const adminSubmissionsParamsSchema = z.object({
  status: z.enum(["SUBMITTED", "APPROVED", "REJECTED"]).default("SUBMITTED"),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  cursor: z.string().uuid().optional(),
});

const followCountsParamsSchema = z.object({
  targetType: z.enum(["ARTIST", "VENUE"]).default("ARTIST"),
  targetId: z.string().uuid(),
});

export const explainQueryNames = ["following_feed", "events_list", "admin_submissions", "follow_counts"] as const;
export type ExplainQueryName = (typeof explainQueryNames)[number];

type ExplainBuildResult = { sql: string; params: unknown[]; sanitizedParams: Record<string, unknown> };

export function buildExplainTarget(name: ExplainQueryName, inputParams: unknown): ExplainBuildResult {
  switch (name) {
    case "following_feed": {
      const parsed = followingFeedParamsSchema.parse(inputParams ?? {});
      return {
        sql: `SELECT e.id
FROM "Event" e
LEFT JOIN "EventArtist" ea ON ea."eventId" = e.id
WHERE e."isPublished" = true
  AND e."startAt" >= NOW()
  AND e."startAt" <= NOW() + ($1::int * INTERVAL '1 day')
ORDER BY e."startAt" ASC, e.id ASC
LIMIT $2`,
        params: [parsed.days, parsed.limit],
        sanitizedParams: parsed,
      };
    }
    case "events_list": {
      const parsed = eventsListParamsSchema.parse(inputParams ?? {});
      return {
        sql: `SELECT e.id
FROM "Event" e
WHERE e."isPublished" = true
  AND e."startAt" >= NOW()
  AND e."startAt" <= NOW() + ($1::int * INTERVAL '1 day')
ORDER BY e."startAt" ASC, e.id ASC
LIMIT $2`,
        params: [parsed.days, parsed.limit],
        sanitizedParams: parsed,
      };
    }
    case "admin_submissions": {
      const parsed = adminSubmissionsParamsSchema.parse(inputParams ?? {});
      return {
        sql: `SELECT s.id
FROM "Submission" s
WHERE s.status = $1
  AND ($2::uuid IS NULL OR s.id > $2::uuid)
ORDER BY s."submittedAt" ASC, s.id ASC
LIMIT $3`,
        params: [parsed.status, parsed.cursor ?? null, parsed.limit],
        sanitizedParams: parsed,
      };
    }
    case "follow_counts": {
      const parsed = followCountsParamsSchema.parse(inputParams ?? {});
      return {
        sql: `SELECT COUNT(*)::int AS count
FROM "Follow" f
WHERE f."targetType" = $1
  AND f."targetId" = $2`,
        params: [parsed.targetType, parsed.targetId],
        sanitizedParams: parsed,
      };
    }
  }
}
