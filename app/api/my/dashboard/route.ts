import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ensureDbUserForSession } from "@/lib/ensure-db-user-for-session";
import { handleGetMyDashboard } from "@/lib/my-dashboard-route";

export const runtime = "nodejs";

export async function GET() {
  return handleGetMyDashboard({
    requireAuth: async () => {
      const session = await getSessionUser();
      if (!session) throw new Error("unauthorized");
      const dbUser = await ensureDbUserForSession(session);
      return { id: dbUser?.id ?? session.id };
    },
    findOwnedArtistByUserId: async (userId) => db.artist.findUnique({
      where: { userId },
      select: {
        id: true,
        name: true,
        slug: true,
        bio: true,
        websiteUrl: true,
        featuredAssetId: true,
        avatarImageUrl: true,
        featuredAsset: { select: { url: true } },
      },
    }),
    listManagedVenuesByUserId: async (userId) => db.venueMembership.findMany({
      where: { userId, role: { in: ["OWNER", "EDITOR"] } },
      select: { venueId: true },
    }).then((rows) => rows.map((row) => ({ id: row.venueId }))),
    listManagedVenueDetailsByUserId: async (userId) => db.venue.findMany({
      where: {
        memberships: {
          some: {
            userId,
            role: { in: ["OWNER", "EDITOR"] },
          },
        },
      },
      select: {
        id: true,
        slug: true,
        name: true,
        city: true,
        country: true,
        isPublished: true,
        featuredAssetId: true,
        featuredAsset: { select: { url: true } },
        submissions: {
          where: { type: "VENUE" },
          select: { status: true },
          orderBy: { updatedAt: "desc" },
          take: 1,
        },
      },
      orderBy: [{ isPublished: "asc" }, { updatedAt: "desc" }],
    }),
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
          select: { asset: { select: { url: true } } },
          orderBy: { sortOrder: "asc" },
          take: 1,
        },
        _count: { select: { images: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),
    listEventsByContext: async ({ artistId, managedVenueIds }) => db.event.findMany({
      where: {
        OR: [
          managedVenueIds.length > 0 ? { venueId: { in: managedVenueIds } } : undefined,
          { eventArtists: { some: { artistId } } },
        ].filter(Boolean) as never,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        startAt: true,
        updatedAt: true,
        isPublished: true,
        venueId: true,
        venue: { select: { name: true } },
      },
      orderBy: [{ startAt: "asc" }, { updatedAt: "desc" }],
      take: 200,
    }),
    listArtworkViewDailyRows: async (artworkIds, start) => db.pageViewDaily.findMany({
      where: {
        entityType: "ARTWORK",
        entityId: { in: artworkIds },
        day: { gte: start },
      },
      select: { entityId: true, day: true, views: true },
    }),
  });
}
