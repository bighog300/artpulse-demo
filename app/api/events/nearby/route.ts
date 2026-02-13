import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiError } from "@/lib/api";
import { resolveImageUrl } from "@/lib/assets";
import { START_AT_ID_ORDER_BY } from "@/lib/cursor-predicate";
import { getBoundingBox, isWithinRadiusKm } from "@/lib/geo";
import { buildNearbyEventsFilters } from "@/lib/nearby-events";
import { nearbyEventsQuerySchema, paramsToObject, zodDetails } from "@/lib/validators";

export const runtime = "nodejs";

type NearbyEventWithJoin = {
  id: string;
  lat: number | null;
  lng: number | null;
  startAt: Date;
  venue: { name: string; slug: string; city: string | null; lat: number | null; lng: number | null } | null;
  images?: Array<{ url: string | null; asset?: { url: string } | null }>;
  eventTags?: Array<{ tag: { name: string; slug: string } }>;
};

function encodeCursor(item: Pick<NearbyEventWithJoin, "id" | "startAt">) {
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
  const parsed = nearbyEventsQuerySchema.safeParse(paramsToObject(req.nextUrl.searchParams));
  if (!parsed.success) return apiError(400, "invalid_request", "Invalid query parameters", zodDetails(parsed.error));

  const { lat, lng, radiusKm, days, cursor, limit } = parsed.data;
  const now = new Date();
  const to = new Date(now);
  to.setDate(to.getDate() + days);
  const box = getBoundingBox(lat, lng, radiusKm);
  const decodedCursor = cursor ? decodeCursor(cursor) : null;
  const nearbyFilters = buildNearbyEventsFilters({ cursor: decodedCursor, from: now, to });

  const items = (await db.event.findMany({
    where: {
      isPublished: true,
      startAt: nearbyFilters.startAt,
      AND: [
        {
          OR: [
            { lat: { gte: box.minLat, lte: box.maxLat }, lng: { gte: box.minLng, lte: box.maxLng } },
            { venue: { lat: { gte: box.minLat, lte: box.maxLat }, lng: { gte: box.minLng, lte: box.maxLng } } },
          ],
        },
        ...nearbyFilters.cursorFilters,
      ],
    },
    take: limit + 1,
    orderBy: START_AT_ID_ORDER_BY,
    include: {
      venue: { select: { name: true, slug: true, city: true, lat: true, lng: true } },
      images: { take: 1, orderBy: { sortOrder: "asc" }, include: { asset: { select: { url: true } } } },
      eventTags: { include: { tag: { select: { name: true, slug: true } } } },
    },
  })) as NearbyEventWithJoin[];

  const filtered = items.filter((event) => {
    const sourceLat = event.lat ?? event.venue?.lat;
    const sourceLng = event.lng ?? event.venue?.lng;
    return sourceLat != null && sourceLng != null && isWithinRadiusKm(lat, lng, sourceLat, sourceLng, radiusKm);
  });

  const hasMore = filtered.length > limit;
  const page = hasMore ? filtered.slice(0, limit) : filtered;

  return NextResponse.json({
    items: page.map((event) => ({
      ...event,
      venueName: event.venue?.name ?? null,
      mapLat: event.lat ?? event.venue?.lat ?? null,
      mapLng: event.lng ?? event.venue?.lng ?? null,
      primaryImageUrl: resolveImageUrl(event.images?.[0]?.asset?.url, event.images?.[0]?.url ?? undefined),
      tags: (event.eventTags ?? []).map((eventTag) => ({ name: eventTag.tag.name, slug: eventTag.tag.slug })),
    })),
    nextCursor: hasMore ? encodeCursor(page[page.length - 1]) : null,
  });
}
