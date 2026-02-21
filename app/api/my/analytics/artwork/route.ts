import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { handleGetMyArtworkAnalytics } from "@/lib/my-analytics-artwork-route";

export const runtime = "nodejs";

export async function GET() {
  return handleGetMyArtworkAnalytics({
    requireAuth,
    findOwnedArtistByUserId: async (userId) => db.artist.findUnique({ where: { userId }, select: { id: true } }),
    listArtworksByArtistId: async (artistId) => db.artwork.findMany({
      where: { artistId },
      select: { id: true, title: true, slug: true, isPublished: true },
    }),
    listArtworkViewDailyRows: async (artworkIds, start) => db.pageViewDaily.findMany({
      where: { entityType: "ARTWORK", entityId: { in: artworkIds }, day: { gte: start } },
      select: { entityId: true, day: true, views: true },
    }),
  });
}
