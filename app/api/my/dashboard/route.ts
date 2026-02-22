import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { handleGetMyDashboard } from "@/lib/my-dashboard-route";

export const runtime = "nodejs";

export async function GET() {
  return handleGetMyDashboard({
    requireAuth,
    findOwnedArtistByUserId: async (userId) => db.artist.findUnique({
      where: { userId },
      select: {
        id: true,
        name: true,
        slug: true,
        bio: true,
        websiteUrl: true,
        instagramUrl: true,
        featuredAssetId: true,
        avatarImageUrl: true,
        featuredAsset: { select: { url: true } },
      },
    }),
    listManagedVenuesByUserId: async (userId) => db.venueMembership.findMany({
      where: { userId },
      select: { venueId: true },
      orderBy: { createdAt: "asc" },
    }).then((rows) => rows.map((row) => ({ id: row.venueId }))),
    listArtworksByArtistId: async (artistId) => db.artwork.findMany({
      where: { artistId },
      select: {
        id: true,
        title: true,
        slug: true,
        isPublished: true,
        featuredAssetId: true,
        updatedAt: true,
        featuredAsset: { select: { url: true } },
        images: {
          select: { id: true, asset: { select: { url: true } } },
          orderBy: { sortOrder: "asc" },
          take: 1,
        },
      },
      orderBy: { updatedAt: "desc" },
    }),
    listEventsForDashboard: async ({ artistId, managedVenueIds, start, end }) => db.event.findMany({
      where: {
        startAt: { gte: start, lte: end },
        OR: [
          managedVenueIds.length ? { venueId: { in: managedVenueIds } } : undefined,
          { eventArtists: { some: { artistId } } },
        ].filter(Boolean) as never,
      },
      select: { id: true, slug: true, title: true, startAt: true, updatedAt: true, venueId: true },
      orderBy: { startAt: "asc" },
      take: 20,
    }),
    listArtworkViewDailyRows: async (artworkIds, start) => db.pageViewDaily.findMany({
      where: { entityType: "ARTWORK", entityId: { in: artworkIds }, day: { gte: start } },
      select: { entityId: true, day: true, views: true },
    }),
  });
}
