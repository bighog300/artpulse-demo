import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { resolveImageUrl } from "@/lib/assets";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") ?? "10") || 10, 20);
    const exclude = (req.nextUrl.searchParams.get("exclude") ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    const follows = await db.follow.findMany({
      where: { userId: user.id },
      select: { targetType: true, targetId: true },
    });

    const followedArtistIds = follows.filter((follow) => follow.targetType === "ARTIST").map((follow) => follow.targetId);
    const followedVenueIds = follows.filter((follow) => follow.targetType === "VENUE").map((follow) => follow.targetId);

    if (!followedArtistIds.length && !followedVenueIds.length) {
      return NextResponse.json({ items: [], reason: null });
    }

    const now = new Date();

    const [followedArtists, followedVenues, seedEvents] = await Promise.all([
      followedArtistIds.length
        ? db.artist.findMany({ where: { id: { in: followedArtistIds } }, select: { id: true, name: true } })
        : Promise.resolve([]),
      followedVenueIds.length
        ? db.venue.findMany({ where: { id: { in: followedVenueIds } }, select: { id: true, name: true } })
        : Promise.resolve([]),
      db.event.findMany({
        where: {
          isPublished: true,
          startAt: { gte: now },
          OR: [
            ...(followedVenueIds.length ? [{ venueId: { in: followedVenueIds } }] : []),
            ...(followedArtistIds.length ? [{ eventArtists: { some: { artistId: { in: followedArtistIds } } } }] : []),
          ],
        },
        take: 80,
        orderBy: { startAt: "asc" },
        include: {
          eventTags: { include: { tag: { select: { slug: true } } } },
          eventArtists: { select: { artistId: true } },
        },
      }),
    ]);

    const tagScore = new Map<string, number>();
    for (const event of seedEvents) {
      for (const eventTag of event.eventTags) {
        const current = tagScore.get(eventTag.tag.slug) ?? 0;
        tagScore.set(eventTag.tag.slug, current + 1);
      }
    }

    const topTags = [...tagScore.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 8)
      .map(([tag]) => tag);

    if (!topTags.length) return NextResponse.json({ items: [], reason: null });

    const excludedIds = new Set<string>([...exclude, ...seedEvents.map((event) => event.id)]);

    const candidates = await db.event.findMany({
      where: {
        isPublished: true,
        startAt: { gte: now },
        id: { notIn: [...excludedIds] },
        eventTags: { some: { tag: { slug: { in: topTags } } } },
      },
      take: 60,
      orderBy: { startAt: "asc" },
      include: {
        venue: { select: { id: true, name: true } },
        images: { take: 1, orderBy: { sortOrder: "asc" }, include: { asset: { select: { url: true } } } },
        eventTags: { include: { tag: { select: { slug: true, name: true } } } },
        eventArtists: { select: { artistId: true } },
      },
    });

    const tagSet = new Set(topTags);
    const followedArtistSet = new Set(followedArtistIds);
    const followedVenueSet = new Set(followedVenueIds);

    const items = candidates
      .map((event) => {
        const tagOverlap = event.eventTags.reduce((total, eventTag) => total + (tagSet.has(eventTag.tag.slug) ? 1 : 0), 0);
        const artistBoost = event.eventArtists.some((eventArtist) => followedArtistSet.has(eventArtist.artistId)) ? 1 : 0;
        const venueBoost = event.venue?.id && followedVenueSet.has(event.venue.id) ? 1 : 0;
        return {
          id: event.id,
          slug: event.slug,
          title: event.title,
          startAt: event.startAt.toISOString(),
          endAt: event.endAt?.toISOString() ?? null,
          venue: event.venue,
          tags: event.eventTags.map((eventTag) => ({ slug: eventTag.tag.slug, name: eventTag.tag.name })),
          primaryImageUrl: resolveImageUrl(event.images?.[0]?.asset?.url, event.images?.[0]?.url),
          score: tagOverlap + artistBoost + venueBoost,
        };
      })
      .filter((event) => event.score > 0)
      .sort((a, b) => b.score - a.score || a.startAt.localeCompare(b.startAt))
      .slice(0, limit);

    const reason = followedArtists[0]?.name ?? followedVenues[0]?.name ?? null;
    return NextResponse.json({ items, reason });
  } catch (error) {
    if (error instanceof Error && error.message === "unauthorized") {
      return apiError(401, "unauthorized", "Authentication required");
    }
    return NextResponse.json({ items: [], reason: null });
  }
}
