import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { FavoriteTargetType } from "@prisma/client";
import { db } from "@/lib/db";
import { resolveImageUrl } from "@/lib/assets";

export const runtime = "nodejs";

const WINDOW_DAYS = 14;
const LIMIT = 10;

const getTrendingEvents = unstable_cache(
  async () => {
    const since = new Date();
    since.setDate(since.getDate() - WINDOW_DAYS);

    const favoriteCounts = await db.favorite.groupBy({
      by: ["targetId"],
      where: {
        targetType: FavoriteTargetType.EVENT,
        createdAt: { gte: since },
      },
      _count: { _all: true },
      orderBy: { _count: { targetId: "desc" } },
      take: LIMIT,
    });

    if (!favoriteCounts.length) return [];

    const scoreMap = new Map(favoriteCounts.map((row) => [row.targetId, row._count._all]));
    const now = new Date();

    const events = await db.event.findMany({
      where: {
        id: { in: favoriteCounts.map((row) => row.targetId) },
        isPublished: true,
        startAt: { gte: now },
      },
      include: {
        venue: { select: { id: true, name: true } },
        images: { take: 1, orderBy: { sortOrder: "asc" }, include: { asset: { select: { url: true } } } },
        eventTags: { include: { tag: { select: { slug: true, name: true } } } },
      },
    });

    return events
      .map((event) => ({
        id: event.id,
        slug: event.slug,
        title: event.title,
        startAt: event.startAt.toISOString(),
        endAt: event.endAt?.toISOString() ?? null,
        venue: event.venue,
        tags: event.eventTags.map((eventTag) => ({ slug: eventTag.tag.slug, name: eventTag.tag.name })),
        primaryImageUrl: resolveImageUrl(event.images?.[0]?.asset?.url, event.images?.[0]?.url),
        score: scoreMap.get(event.id) ?? 0,
      }))
      .sort((a, b) => b.score - a.score || a.startAt.localeCompare(b.startAt))
      .slice(0, LIMIT);
  },
  ["api-trending-events-v1"],
  { revalidate: 300 },
);

export async function GET() {
  const items = await getTrendingEvents();
  return NextResponse.json({ items });
}
