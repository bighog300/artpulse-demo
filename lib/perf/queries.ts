import { z } from "zod";

const paginationParamsSchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(24),
});

const daysLimitParamsSchema = z.object({
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

const eventFiltersParamsSchema = z.object({
  fromDays: z.coerce.number().int().min(0).max(365).default(0),
  toDays: z.coerce.number().int().min(1).max(365).default(30),
  limit: z.coerce.number().int().min(1).max(50).default(24),
  query: z.string().trim().min(1).max(120).default("jazz"),
  tags: z.array(z.string().trim().min(1)).max(5).default(["music", "art"]),
  minLat: z.coerce.number().min(-90).max(90).default(40.5),
  maxLat: z.coerce.number().min(-90).max(90).default(41.0),
  minLng: z.coerce.number().min(-180).max(180).default(-74.3),
  maxLng: z.coerce.number().min(-180).max(180).default(-73.7),
});

export const explainQueryNames = [
  "events_list",
  "events_query",
  "events_tags",
  "events_date_range",
  "events_geo_bbox",
  "trending_groupby",
  "trending_event_lookup",
  "recommendations_seed",
  "venue_upcoming",
  "artist_upcoming",
  "artist_past",
  "admin_submissions",
  "follow_counts",
] as const;
export type ExplainQueryName = (typeof explainQueryNames)[number];

type ExplainBuildResult = { sql: string; params: unknown[]; sanitizedParams: Record<string, unknown> };

export function buildExplainTarget(name: ExplainQueryName, inputParams: unknown): ExplainBuildResult {
  switch (name) {
    case "events_list": {
      const parsed = paginationParamsSchema.parse(inputParams ?? {});
      return {
        sql: `SELECT e.id
FROM "Event" e
WHERE e."isPublished" = true
ORDER BY e."startAt" ASC, e.id ASC
LIMIT $1`,
        params: [parsed.limit],
        sanitizedParams: parsed,
      };
    }
    case "events_query": {
      const parsed = eventFiltersParamsSchema.parse(inputParams ?? {});
      return {
        sql: `SELECT e.id
FROM "Event" e
WHERE e."isPublished" = true
  AND (e.title ILIKE ('%' || $1 || '%') OR e.description ILIKE ('%' || $1 || '%'))
ORDER BY e."startAt" ASC, e.id ASC
LIMIT $2`,
        params: [parsed.query, parsed.limit],
        sanitizedParams: { queryLength: parsed.query.length, limit: parsed.limit },
      };
    }
    case "events_tags": {
      const parsed = eventFiltersParamsSchema.parse(inputParams ?? {});
      return {
        sql: `SELECT e.id
FROM "Event" e
WHERE e."isPublished" = true
  AND EXISTS (
    SELECT 1
    FROM "EventTag" et
    INNER JOIN "Tag" t ON t.id = et."tagId"
    WHERE et."eventId" = e.id
      AND t.slug = ANY($1::text[])
  )
ORDER BY e."startAt" ASC, e.id ASC
LIMIT $2`,
        params: [parsed.tags, parsed.limit],
        sanitizedParams: { tagCount: parsed.tags.length, limit: parsed.limit },
      };
    }
    case "events_date_range": {
      const parsed = eventFiltersParamsSchema.parse(inputParams ?? {});
      return {
        sql: `SELECT e.id
FROM "Event" e
WHERE e."isPublished" = true
  AND e."startAt" >= NOW() + ($1::int * INTERVAL '1 day')
  AND e."startAt" <= NOW() + ($2::int * INTERVAL '1 day')
ORDER BY e."startAt" ASC, e.id ASC
LIMIT $3`,
        params: [parsed.fromDays, parsed.toDays, parsed.limit],
        sanitizedParams: { fromDays: parsed.fromDays, toDays: parsed.toDays, limit: parsed.limit },
      };
    }
    case "events_geo_bbox": {
      const parsed = eventFiltersParamsSchema.parse(inputParams ?? {});
      return {
        sql: `SELECT e.id
FROM "Event" e
LEFT JOIN "Venue" v ON v.id = e."venueId"
WHERE e."isPublished" = true
  AND (
    (e.lat BETWEEN $1 AND $2 AND e.lng BETWEEN $3 AND $4)
    OR
    (v.lat BETWEEN $1 AND $2 AND v.lng BETWEEN $3 AND $4)
  )
ORDER BY e."startAt" ASC, e.id ASC
LIMIT $5`,
        params: [parsed.minLat, parsed.maxLat, parsed.minLng, parsed.maxLng, parsed.limit],
        sanitizedParams: { limit: parsed.limit },
      };
    }
    case "trending_groupby": {
      const parsed = daysLimitParamsSchema.parse(inputParams ?? {});
      return {
        sql: `SELECT f."targetId", COUNT(*)::int AS count
FROM "Favorite" f
WHERE f."targetType" = 'EVENT'
  AND f."createdAt" >= NOW() - ($1::int * INTERVAL '1 day')
GROUP BY f."targetId"
ORDER BY count DESC
LIMIT $2`,
        params: [parsed.days, parsed.limit],
        sanitizedParams: parsed,
      };
    }
    case "trending_event_lookup": {
      const parsed = daysLimitParamsSchema.parse(inputParams ?? {});
      return {
        sql: `SELECT e.id
FROM "Event" e
WHERE e."isPublished" = true
  AND e."startAt" >= NOW()
ORDER BY e."startAt" ASC, e.id ASC
LIMIT $1`,
        params: [parsed.limit],
        sanitizedParams: { limit: parsed.limit },
      };
    }
    case "recommendations_seed": {
      const parsed = paginationParamsSchema.parse(inputParams ?? {});
      return {
        sql: `SELECT e.id
FROM "Event" e
WHERE e."isPublished" = true
  AND e."startAt" >= NOW()
  AND (
    e."venueId" = ANY($1::uuid[])
    OR EXISTS (
      SELECT 1
      FROM "EventArtist" ea
      WHERE ea."eventId" = e.id
        AND ea."artistId" = ANY($2::uuid[])
    )
  )
ORDER BY e."startAt" ASC
LIMIT $3`,
        params: [
          ["00000000-0000-0000-0000-000000000001"],
          ["00000000-0000-0000-0000-000000000002"],
          Math.max(parsed.limit, 30),
        ],
        sanitizedParams: { venueIds: 1, artistIds: 1, limit: Math.max(parsed.limit, 30) },
      };
    }
    case "venue_upcoming": {
      const parsed = paginationParamsSchema.parse(inputParams ?? {});
      return {
        sql: `SELECT e.id
FROM "Event" e
WHERE e."venueId" = $1::uuid
  AND e."isPublished" = true
  AND e."startAt" >= NOW()
ORDER BY e."startAt" ASC, e.id ASC
LIMIT $2`,
        params: ["00000000-0000-0000-0000-000000000010", parsed.limit],
        sanitizedParams: { limit: parsed.limit },
      };
    }
    case "artist_upcoming": {
      const parsed = paginationParamsSchema.parse(inputParams ?? {});
      return {
        sql: `SELECT ea."eventId"
FROM "EventArtist" ea
INNER JOIN "Event" e ON e.id = ea."eventId"
WHERE ea."artistId" = $1::uuid
  AND e."isPublished" = true
  AND e."startAt" >= NOW()
ORDER BY e."startAt" ASC
LIMIT $2`,
        params: ["00000000-0000-0000-0000-000000000011", parsed.limit],
        sanitizedParams: { limit: parsed.limit },
      };
    }
    case "artist_past": {
      const parsed = paginationParamsSchema.parse(inputParams ?? {});
      return {
        sql: `SELECT ea."eventId"
FROM "EventArtist" ea
INNER JOIN "Event" e ON e.id = ea."eventId"
WHERE ea."artistId" = $1::uuid
  AND e."isPublished" = true
  AND e."startAt" < NOW()
ORDER BY e."startAt" DESC
LIMIT $2`,
        params: ["00000000-0000-0000-0000-000000000011", parsed.limit],
        sanitizedParams: { limit: parsed.limit },
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
