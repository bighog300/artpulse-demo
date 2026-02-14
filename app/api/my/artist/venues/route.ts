import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { resolveImageUrl } from "@/lib/assets";
import { handleListMyArtistVenueAssociations } from "@/lib/my-artist-venues-route";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  return handleListMyArtistVenueAssociations(req, {
    requireAuth,
    findOwnedArtistByUserId: async (userId) => db.artist.findUnique({ where: { userId }, select: { id: true } }),
    listAssociationsByArtistId: async (artistId) => {
      const rows = await db.artistVenueAssociation.findMany({
        where: { artistId },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          status: true,
          role: true,
          message: true,
          createdAt: true,
          updatedAt: true,
          venue: { select: { id: true, name: true, slug: true, featuredImageUrl: true, featuredAsset: { select: { url: true } } } },
        },
      });

      return rows.map((row) => ({
        id: row.id,
        status: row.status,
        role: row.role,
        message: row.message,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        venue: {
          id: row.venue.id,
          name: row.venue.name,
          slug: row.venue.slug,
          cover: resolveImageUrl(row.venue.featuredAsset?.url, row.venue.featuredImageUrl),
        },
      }));
    },
  });
}
