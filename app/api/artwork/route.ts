import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveImageUrl } from "@/lib/assets";
import { apiError } from "@/lib/api";
import { artworkListQuerySchema, paramsToObject, zodDetails } from "@/lib/validators";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const parsed = artworkListQuerySchema.safeParse(paramsToObject(req.nextUrl.searchParams));
  if (!parsed.success) return apiError(400, "invalid_request", "Invalid query parameters", zodDetails(parsed.error));
  const { query, artistId, venueId, eventId, medium, year, page, pageSize } = parsed.data;

  const where = {
    isPublished: true,
    ...(artistId ? { artistId } : {}),
    ...(medium ? { medium: { equals: medium, mode: "insensitive" as const } } : {}),
    ...(year ? { year } : {}),
    ...(query ? { OR: [{ title: { contains: query, mode: "insensitive" as const } }, { description: { contains: query, mode: "insensitive" as const } }] } : {}),
    ...(venueId ? { venues: { some: { venueId } } } : {}),
    ...(eventId ? { events: { some: { eventId } } } : {}),
  };

  const [items, total] = await Promise.all([
    db.artwork.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        slug: true,
        title: true,
        year: true,
        medium: true,
        artist: { select: { id: true, name: true } },
        featuredAsset: { select: { url: true } },
        images: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], take: 1, select: { asset: { select: { url: true } } } },
      },
    }),
    db.artwork.count({ where }),
  ]);

  return NextResponse.json({
    items: items.map((item) => ({
      id: item.id,
      slug: item.slug,
      title: item.title,
      artist: item.artist,
      coverUrl: resolveImageUrl(item.featuredAsset?.url, item.images[0]?.asset?.url),
      year: item.year,
      medium: item.medium,
    })),
    page,
    pageSize,
    total,
  });
}
