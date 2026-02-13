import { Prisma, SavedSearchType } from "@prisma/client";
import { z } from "zod";
import { START_AT_ID_ORDER_BY, buildStartAtIdCursorPredicate, type StartAtIdCursor } from "@/lib/cursor-predicate";
import { getBoundingBox, isWithinRadiusKm } from "@/lib/geo";
import { buildNearbyEventsFilters } from "@/lib/nearby-events";

const nearbyParamsSchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radiusKm: z.coerce.number().int().default(25).transform((value) => Math.max(1, Math.min(200, value))),
  days: z.union([z.literal(7), z.literal(30)]).default(30),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).optional().default([]),
});

const eventsFilterParamsSchema = z.object({
  q: z.string().trim().min(1).optional().transform((value) => value ? value.slice(0, 120) : value),
  from: z.iso.datetime({ offset: true }).or(z.iso.datetime({ local: true })).optional(),
  to: z.iso.datetime({ offset: true }).or(z.iso.datetime({ local: true })).optional(),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).optional().default([]),
  venue: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  artist: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  radiusKm: z.coerce.number().int().optional().transform((value) => value == null ? value : Math.max(1, Math.min(200, value))),
}).superRefine((data, ctx) => {
  const hasLat = data.lat != null;
  const hasLng = data.lng != null;
  const hasRadius = data.radiusKm != null;
  if (hasLat !== hasLng) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: [hasLat ? "lng" : "lat"], message: "lat and lng must be provided together" });
  }
  if ((hasLat || hasLng) && !hasRadius) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["radiusKm"], message: "radiusKm is required when lat/lng are provided" });
  }
});

export const savedSearchParamsSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("NEARBY"), params: nearbyParamsSchema }),
  z.object({ type: z.literal("EVENTS_FILTER"), params: eventsFilterParamsSchema }),
]);

export const savedSearchCreateSchema = z.object({
  type: z.enum(["NEARBY", "EVENTS_FILTER"]),
  name: z.string().trim().min(1).max(80),
  params: z.unknown(),
  frequency: z.enum(["WEEKLY"]).optional(),
});

export const savedSearchPatchSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  params: z.unknown().optional(),
  frequency: z.enum(["WEEKLY"]).optional(),
  isEnabled: z.boolean().optional(),
});

function normalizeNearby(rawParams: unknown) {
  const parsed = nearbyParamsSchema.parse(rawParams);
  return { lat: parsed.lat, lng: parsed.lng, radiusKm: parsed.radiusKm, days: parsed.days, tags: parsed.tags };
}

function normalizeEventsFilter(rawParams: unknown) {
  const parsed = eventsFilterParamsSchema.parse(rawParams);
  return {
    q: parsed.q ?? null,
    from: parsed.from ?? null,
    to: parsed.to ?? null,
    tags: parsed.tags,
    venue: parsed.venue ?? null,
    artist: parsed.artist ?? null,
    lat: parsed.lat ?? null,
    lng: parsed.lng ?? null,
    radiusKm: parsed.radiusKm ?? null,
  };
}

export function normalizeSavedSearchParams(type: SavedSearchType, rawParams: unknown) {
  return type === "NEARBY" ? normalizeNearby(rawParams) : normalizeEventsFilter(rawParams);
}

type EventSearchDb = { event: { findMany: (args: Prisma.EventFindManyArgs) => Promise<Array<{ id: string; title: string; slug: string; startAt: Date; lat: number | null; lng: number | null; venue: { name: string; slug: string; city: string | null; lat: number | null; lng: number | null } | null; eventTags: Array<{ tag: { name: string; slug: string } }> }>> } };

export async function runSavedSearchEvents(args: {
  eventDb: EventSearchDb;
  type: SavedSearchType;
  paramsJson: Prisma.JsonValue;
  cursor?: StartAtIdCursor | null;
  limit: number;
}) {
  const { eventDb, type, paramsJson, cursor, limit } = args;
  if (type === "NEARBY") {
    const params = normalizeNearby(paramsJson);
    const now = new Date();
    const to = new Date(now);
    to.setDate(to.getDate() + params.days);
    const box = getBoundingBox(params.lat, params.lng, params.radiusKm);
    const nearbyFilters = buildNearbyEventsFilters({ cursor, from: now, to });
    const items = await eventDb.event.findMany({
      where: {
        isPublished: true,
        startAt: nearbyFilters.startAt,
        AND: [{ OR: [
          { lat: { gte: box.minLat, lte: box.maxLat }, lng: { gte: box.minLng, lte: box.maxLng } },
          { venue: { lat: { gte: box.minLat, lte: box.maxLat }, lng: { gte: box.minLng, lte: box.maxLng } } },
        ] }, ...nearbyFilters.cursorFilters],
      },
      take: limit + 1,
      orderBy: START_AT_ID_ORDER_BY,
      include: { venue: { select: { name: true, slug: true, city: true, lat: true, lng: true } }, eventTags: { include: { tag: { select: { name: true, slug: true } } } } },
    });
    const tagSet = new Set(params.tags);
    return items.filter((e) => {
      const sourceLat = e.lat ?? e.venue?.lat;
      const sourceLng = e.lng ?? e.venue?.lng;
      if (sourceLat == null || sourceLng == null) return false;
      const withinRadius = isWithinRadiusKm(params.lat, params.lng, sourceLat, sourceLng, params.radiusKm);
      if (!withinRadius) return false;
      return !tagSet.size || e.eventTags.some((et) => tagSet.has(et.tag.slug));
    });
  }

  const params = normalizeEventsFilter(paramsJson);
  const filters: Prisma.EventWhereInput[] = [];
  if (params.q) filters.push({ OR: [{ title: { contains: params.q, mode: "insensitive" } }, { description: { contains: params.q, mode: "insensitive" } }] });
  if (params.from || params.to) filters.push({ startAt: { gte: params.from ? new Date(params.from) : undefined, lte: params.to ? new Date(params.to) : undefined } });
  if (params.venue) filters.push({ venue: { slug: params.venue } });
  if (params.artist) filters.push({ eventArtists: { some: { artist: { slug: params.artist, isPublished: true } } } });
  if (params.tags.length) filters.push({ eventTags: { some: { tag: { slug: { in: params.tags } } } } });
  if (params.lat != null && params.lng != null && params.radiusKm != null) {
    const box = getBoundingBox(params.lat, params.lng, params.radiusKm);
    filters.push({ OR: [
      { lat: { gte: box.minLat, lte: box.maxLat }, lng: { gte: box.minLng, lte: box.maxLng } },
      { venue: { lat: { gte: box.minLat, lte: box.maxLat }, lng: { gte: box.minLng, lte: box.maxLng } } },
    ] });
  }
  filters.push(...buildStartAtIdCursorPredicate(cursor));
  const items = await eventDb.event.findMany({
    where: { isPublished: true, ...(filters.length ? { AND: filters } : {}) },
    take: limit + 1,
    orderBy: START_AT_ID_ORDER_BY,
    include: { venue: { select: { name: true, slug: true, city: true, lat: true, lng: true } }, eventTags: { include: { tag: { select: { name: true, slug: true } } } } },
  });
  if (params.lat == null || params.lng == null || params.radiusKm == null) return items;
  const lat = params.lat;
  const lng = params.lng;
  const radiusKm = params.radiusKm;
  return items.filter((e) => {
    const sourceLat = e.lat ?? e.venue?.lat;
    const sourceLng = e.lng ?? e.venue?.lng;
    return sourceLat != null && sourceLng != null && isWithinRadiusKm(lat, lng, sourceLat, sourceLng, radiusKm);
  });
}
