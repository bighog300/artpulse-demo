import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { toDate } from "@/lib/validators";

type EventWithJoin = { id: string; images?: Array<{ url: string }>; eventTags?: Array<{ tag: { name: string; slug: string } }> };

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const limit = Math.min(Number(sp.get("limit") || 20), 50);
  const cursor = sp.get("cursor") || undefined;
  const from = toDate(sp.get("from"));
  const to = toDate(sp.get("to"));
  const query = sp.get("query") || undefined;
  const venue = sp.get("venue") || undefined;
  const artist = sp.get("artist") || undefined;
  const tags = (sp.get("tags") || "").split(",").map((t) => t.trim()).filter(Boolean);

  const items = (await db.event.findMany({
    where: {
      isPublished: true,
      ...(query ? { OR: [{ title: { contains: query, mode: "insensitive" } }, { description: { contains: query, mode: "insensitive" } }] } : {}),
      ...(from || to ? { startAt: { gte: from ?? undefined, lte: to ?? undefined } } : {}),
      ...(venue ? { venue: { slug: venue } } : {}),
      ...(artist ? { eventArtists: { some: { artist: { slug: artist, isPublished: true } } } } : {}),
      ...(tags.length ? { eventTags: { some: { tag: { slug: { in: tags } } } } } : {}),
    },
    take: limit + 1,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    orderBy: [{ startAt: "asc" }, { id: "asc" }],
    include: { venue: { select: { name: true, slug: true, city: true } }, images: { take: 1, orderBy: { sortOrder: "asc" } }, eventTags: { include: { tag: true } } },
  })) as EventWithJoin[];

  const hasMore = items.length > limit;
  const page = hasMore ? items.slice(0, limit) : items;
  return NextResponse.json({
    items: page.map((e) => ({ ...e, primaryImageUrl: e.images?.[0]?.url ?? null, tags: (e.eventTags ?? []).map((et) => ({ name: et.tag.name, slug: et.tag.slug })) })),
    nextCursor: hasMore ? page[page.length - 1].id : null,
  });
}
