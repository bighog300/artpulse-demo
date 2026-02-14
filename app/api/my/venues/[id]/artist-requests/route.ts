import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { resolveImageUrl } from "@/lib/assets";
import { handleListVenueArtistRequests } from "@/lib/my-venue-artist-requests-route";

export const runtime = "nodejs";

async function requireVenueMembership(userId: string, venueId: string) {
  const membership = await db.venueMembership.findUnique({ where: { userId_venueId: { userId, venueId } }, select: { id: true } });
  if (!membership) throw new Error("forbidden");
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return handleListVenueArtistRequests(req, params, {
    requireAuth,
    requireVenueMembership,
    listPendingForVenue: async (venueId) => {
      const rows = await db.artistVenueAssociation.findMany({
        where: { venueId, status: "PENDING" },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          venueId: true,
          role: true,
          message: true,
          createdAt: true,
          artist: {
            select: {
              id: true,
              name: true,
              slug: true,
              featuredImageUrl: true,
              featuredAsset: { select: { url: true } },
            },
          },
        },
      });

      return rows.map((row) => ({
        id: row.id,
        venueId: row.venueId,
        role: row.role,
        message: row.message,
        createdAt: row.createdAt,
        artist: {
          id: row.artist.id,
          name: row.artist.name,
          slug: row.artist.slug,
          cover: resolveImageUrl(row.artist.featuredAsset?.url, row.artist.featuredImageUrl),
        },
      }));
    },
  });
}
