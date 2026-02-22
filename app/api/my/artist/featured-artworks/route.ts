import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { logAdminAction } from "@/lib/admin-audit";
import { handleGetMyArtistFeaturedArtworks, handlePutMyArtistFeaturedArtworks } from "@/lib/my-artist-featured-artworks-route";

export const runtime = "nodejs";

const selectFeatured = {
  sortOrder: true,
  artwork: {
    select: {
      id: true,
      slug: true,
      title: true,
      featuredAsset: { select: { url: true } },
      images: { orderBy: [{ sortOrder: "asc" as const }, { createdAt: "asc" as const }], take: 1, select: { asset: { select: { url: true } } } },
    },
  },
};

const deps = {
  requireAuth,
  findOwnedArtistByUserId: (userId: string) => db.artist.findUnique({ where: { userId }, select: { id: true } }),
  listFeatured: (artistId: string) => db.artistFeaturedArtwork.findMany({ where: { artistId }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], select: selectFeatured }),
  findPublishedOwnedArtworkIds: async (artistId: string, artworkIds: string[]) => {
    if (!artworkIds.length) return [];
    const rows = await db.artwork.findMany({ where: { artistId, isPublished: true, id: { in: artworkIds } }, select: { id: true } });
    return rows.map((row) => row.id);
  },
  replaceFeatured: async (artistId: string, artworkIds: string[]) => {
    await db.$transaction(async (tx) => {
      await tx.artistFeaturedArtwork.deleteMany({ where: { artistId } });
      if (!artworkIds.length) return;
      await tx.artistFeaturedArtwork.createMany({ data: artworkIds.map((artworkId, index) => ({ artistId, artworkId, sortOrder: index })) });
    });
  },
  logAdminAction,
};

export async function GET(req: NextRequest) {
  return handleGetMyArtistFeaturedArtworks(req, deps);
}

export async function PUT(req: NextRequest) {
  return handlePutMyArtistFeaturedArtworks(req, deps);
}
