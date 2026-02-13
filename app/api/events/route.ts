import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { apiError } from "@/lib/api";
import { resolveImageUrl } from "@/lib/assets";
import { eventsQuerySchema, paramsToObject, zodDetails } from "@/lib/validators";

type EventWithJoin = {
  id: string;
  lat: number | null;
  lng: number | null;
  venue?: { lat: number | null; lng: number | null } | null;
  images?: Array<{ url: string; asset?: { url: string } | null }>;
  eventTags?: Array<{ tag: { name: string; slug: string } }>;
  startAt: Date;
};

export const runtime = "nodejs";

const shouldLogPerf = process.env.NODE_ENV !== "production" || process.env.DEBUG_PERF === "1";

function bounds(lat: number, lng: number, radiusKm: number) {
  const latDelta = radiusKm / 111;
  const lngDelta = radiusKm / (111 * Math.cos((lat * Math.PI) / 180));
  return { minLat: lat - latDelta, maxLat: lat + latDelta, minLng: lng - lngDelta, maxLng: lng + lngDelta };
}

function isInRadius(lat1: number, lng1: number, lat2: number, lng2: number, radiusKm: number) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const r = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * r * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) <= radiusKm;
}

function encodeCursor(item: Pick<EventWithJoin, "id" | "startAt">) {
  return Buffer.from(JSON.stringify({ id: item.id, startAt: item.startAt.toISOString() })).toString("base64url");
}

function decodeCursor(cursor: string) {
  try {
    const parsed = JSON.parse(Buffer.from(cursor, "base64url").toString("utf-8")) as { id?: string; startAt?: string };
    if (!parsed.id || !parsed.startAt) return null;
    const startAt = new Date(parsed.startAt);
    if (Number.isNaN(startAt.getTime())) return null;
    return { id: parsed.id, startAt };
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const parsed = eventsQuerySchema.safeParse(paramsToObject(req.nextUrl.searchParams));
  if (!parsed.success) return apiError(400, "invalid_request", "Invalid query parameters", zodDetails(parsed.error));

  const { cursor, limit, query, venue, artist, from, to, tags, lat, lng, radiusKm } = parsed.data;
  const tagList = (tags || "").split(",").map((t) => t.trim()).filter(Boolean);
  const box = lat != null && lng != null && radiusKm != null ? bounds(lat, lng, radiusKm) : null;
  const decodedCursor = cursor ? decodeCursor(cursor) : null;

  const filters: Prisma.EventWhereInput[] = [];
  if (query) filters.push({ OR: [{ title: { contains: query, mode: "insensitive" } }, { description: { contains: query, mode: "insensitive" } }] });
  if (from || to) filters.push({ startAt: { gte: from ? new Date(from) : undefined, lte: to ? new Date(to) : undefined } });
  if (venue) filters.push({ venue: { slug: venue } });
  if (artist) filters.push({ eventArtists: { some: { artist: { slug: artist, isPublished: true } } } });
  if (tagList.length) filters.push({ eventTags: { some: { tag: { slug: { in: tagList } } } } });
  if (box) {
    filters.push({
      OR: [
        { lat: { gte: box.minLat, lte: box.maxLat }, lng: { gte: box.minLng, lte: box.maxLng } },
        { venue: { lat: { gte: box.minLat, lte: box.maxLat }, lng: { gte: box.minLng, lte: box.maxLng } } },
      ],
    });
  }
  if (decodedCursor) {
    filters.push({ OR: [{ startAt: { gt: decodedCursor.startAt } }, { startAt: decodedCursor.startAt, id: { gt: decodedCursor.id } }] });
  }

  const startedAt = performance.now();
  const items = (await db.event.findMany({
    where: {
      isPublished: true,
      ...(filters.length ? { AND: filters } : {}),
    },
    take: limit + 1,
    orderBy: [{ startAt: "asc" }, { id: "asc" }],
    include: {
      venue: { select: { name: true, slug: true, city: true, lat: true, lng: true } },
      images: { take: 1, orderBy: { sortOrder: "asc" }, include: { asset: { select: { url: true } } } },
      eventTags: { include: { tag: { select: { name: true, slug: true } } } },
    },
  })) as EventWithJoin[];
  if (shouldLogPerf) console.info(`[perf] events listing=${(performance.now() - startedAt).toFixed(1)}ms`);

  const filtered = box && lat != null && lng != null && radiusKm != null
    ? items.filter((e) => {
        const sourceLat = e.lat ?? e.venue?.lat;
        const sourceLng = e.lng ?? e.venue?.lng;
        return sourceLat != null && sourceLng != null && isInRadius(lat, lng, sourceLat, sourceLng, radiusKm);
      })
    : items;

  const hasMore = filtered.length > limit;
  const page = hasMore ? filtered.slice(0, limit) : filtered;
  return NextResponse.json({
    items: page.map((e) => ({ ...e, primaryImageUrl: resolveImageUrl(e.images?.[0]?.asset?.url, e.images?.[0]?.url), tags: (e.eventTags ?? []).map((et) => ({ name: et.tag.name, slug: et.tag.slug })) })),
    nextCursor: hasMore ? encodeCursor(page[page.length - 1]) : null,
  });
}
