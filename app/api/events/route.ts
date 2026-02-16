import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { apiError } from "@/lib/api";
import { resolveImageUrl } from "@/lib/assets";
import { eventsQuerySchema, paramsToObject, zodDetails } from "@/lib/validators";
import { buildStartAtIdCursorPredicate, START_AT_ID_ORDER_BY } from "@/lib/cursor-predicate";
import { getBoundingBox, isWithinRadiusKm } from "@/lib/geo";

type EventWithJoin = {
  id: string;
  lat: number | null;
  lng: number | null;
  venue?: { lat: number | null; lng: number | null } | null;
  images?: Array<{ url: string; asset?: { url: string } | null }>;
  eventTags?: Array<{ tag: { name: string; slug: string } }>;
  eventArtists?: Array<{ artistId: string }>;
  startAt: Date;
};

export const runtime = "nodejs";

const shouldLogPerf = process.env.NODE_ENV !== "production" || process.env.DEBUG_PERF === "1";


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
  const box = lat != null && lng != null && radiusKm != null ? getBoundingBox(lat, lng, radiusKm) : null;
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
  filters.push(...buildStartAtIdCursorPredicate(decodedCursor));

  const startedAt = performance.now();
  const items = (await db.event.findMany({
    where: {
      isPublished: true,
      ...(filters.length ? { AND: filters } : {}),
    },
    take: limit + 1,
    orderBy: START_AT_ID_ORDER_BY,
    include: {
      eventArtists: { select: { artistId: true } },
      venue: { select: { id: true, name: true, slug: true, city: true, lat: true, lng: true } },
      images: { take: 1, orderBy: { sortOrder: "asc" }, include: { asset: { select: { url: true } } } },
      eventTags: { include: { tag: { select: { name: true, slug: true } } } },
    },
  })) as EventWithJoin[];
  if (shouldLogPerf) console.info(`[perf] events listing=${(performance.now() - startedAt).toFixed(1)}ms`);

  const filtered = box && lat != null && lng != null && radiusKm != null
    ? items.filter((e) => {
        const sourceLat = e.lat ?? e.venue?.lat;
        const sourceLng = e.lng ?? e.venue?.lng;
        return sourceLat != null && sourceLng != null && isWithinRadiusKm(lat, lng, sourceLat, sourceLng, radiusKm);
      })
    : items;

  const hasMore = filtered.length > limit;
  const page = hasMore ? filtered.slice(0, limit) : filtered;
  return NextResponse.json({
    items: page.map((e) => ({
      ...e,
      primaryImageUrl: resolveImageUrl(e.images?.[0]?.asset?.url, e.images?.[0]?.url),
      tags: (e.eventTags ?? []).map((et) => ({ name: et.tag.name, slug: et.tag.slug })),
      artistIds: (e.eventArtists ?? []).map((eventArtist) => eventArtist.artistId),
    })),
    nextCursor: hasMore ? encodeCursor(page[page.length - 1]) : null,
  });
}
