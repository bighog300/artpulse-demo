import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiError } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";
import { idParamSchema, zodDetails } from "@/lib/validators";
import { resolveImageUrl } from "@/lib/assets";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const parsedId = idParamSchema.safeParse(await params);
  if (!parsedId.success) return apiError(400, "invalid_request", "Invalid route parameter", zodDetails(parsedId.error));

  const user = await getSessionUser();
  const artwork = await db.artwork.findUnique({
    where: { id: parsedId.data.id },
    select: {
      id: true,
      title: true,
      description: true,
      year: true,
      medium: true,
      dimensions: true,
      priceAmount: true,
      currency: true,
      isPublished: true,
      artistId: true,
      artist: { select: { id: true, name: true, slug: true, userId: true } },
      featuredAsset: { select: { url: true } },
      images: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], select: { id: true, alt: true, sortOrder: true, asset: { select: { url: true } } } },
      venues: { select: { venue: { select: { id: true, name: true, slug: true } } } },
      events: { select: { event: { select: { id: true, title: true, slug: true } } } },
    },
  });

  if (!artwork) return apiError(404, "not_found", "Artwork not found");
  const canViewUnpublished = Boolean(user?.role === "ADMIN" || artwork.artist.userId === user?.id);
  if (!artwork.isPublished && !canViewUnpublished) return apiError(404, "not_found", "Artwork not found");

  return NextResponse.json({
    artwork: {
      ...artwork,
      coverUrl: resolveImageUrl(artwork.featuredAsset?.url, artwork.images[0]?.asset?.url),
      images: artwork.images.map((image) => ({ ...image, url: image.asset.url })),
      venues: artwork.venues.map((item) => item.venue),
      events: artwork.events.map((item) => item.event),
    },
  });
}
