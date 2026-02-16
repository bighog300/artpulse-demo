import Image from "next/image";
import Link from "next/link";
import { DiscoveryFilterBar } from "@/components/discovery/discovery-filter-bar";
import { FollowButton } from "@/components/follows/follow-button";
import { getSessionUser } from "@/lib/auth";
import { getVenueAssocCounts, getVenueRoleFacetCounts } from "@/lib/discovery-counts";
import { db } from "@/lib/db";
import { parseDiscoveryFilters } from "@/lib/discovery-filters";
import { hasDatabaseUrl } from "@/lib/runtime-db";
import { mapNextUpcomingEventByVenueId } from "@/lib/venue-events";
import { resolveVenueCoverUrl } from "@/lib/venues";

export const revalidate = 300;

type VenuesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function VenuesPage({ searchParams }: VenuesPageProps) {
  const params = await searchParams;
  const filters = parseDiscoveryFilters(params);
  const user = await getSessionUser();

  if (!hasDatabaseUrl()) {
    return (
      <main className="p-6">
        <h1 className="mb-4 text-2xl font-semibold">Venues</h1>
        <DiscoveryFilterBar assoc={filters.assoc} role={filters.role} />
        <p className="mt-4">Set DATABASE_URL to view events locally.</p>
      </main>
    );
  }

  const [items, assocCounts, roleCounts] = await Promise.all([
    db.venue.findMany({
      where: {
        isPublished: true,
        ...(filters.assoc === "verified"
          ? {
              artistAssociations: {
                some: {
                  status: "APPROVED",
                  ...(filters.role ? { role: filters.role } : {}),
                },
              },
            }
          : {}),
        ...(filters.assoc === "exhibitions"
          ? {
              events: {
                some: {
                  isPublished: true,
                  eventArtists: {
                    some: {},
                  },
                },
              },
            }
          : {}),
        ...(filters.assoc === "none"
          ? {
              AND: [
                { artistAssociations: { none: { status: "APPROVED" } } },
                {
                  events: {
                    none: {
                      isPublished: true,
                      eventArtists: {
                        some: {},
                      },
                    },
                  },
                },
              ],
            }
          : {}),
      },
      orderBy: { name: "asc" },
      select: {
        id: true,
        slug: true,
        name: true,
        city: true,
        region: true,
        country: true,
        description: true,
        featuredImageUrl: true,
        featuredAsset: { select: { url: true } },
      },
    }),
    getVenueAssocCounts(db),
    getVenueRoleFacetCounts(db),
  ]);

  const upcomingEvents =
    items.length > 0
      ? await db.event.findMany({
          where: { isPublished: true, startAt: { gte: new Date() }, venueId: { in: items.map((venue) => venue.id), not: null } },
          orderBy: [{ startAt: "asc" }, { id: "asc" }],
          select: { venueId: true, slug: true, title: true, startAt: true },
        })
      : [];

  const venueIds = items.map((venue) => venue.id);
  const [followerCounts, userFollows] = await Promise.all([
    venueIds.length
      ? db.follow.groupBy({
          by: ["targetId"],
          where: { targetType: "VENUE", targetId: { in: venueIds } },
          _count: { _all: true },
        })
      : Promise.resolve([]),
    user && venueIds.length
      ? db.follow.findMany({
          where: { userId: user.id, targetType: "VENUE", targetId: { in: venueIds } },
          select: { targetId: true },
        })
      : Promise.resolve([]),
  ]);

  const followerCountByVenueId = new Map(followerCounts.map((entry) => [entry.targetId, entry._count._all]));
  const followedVenueIds = new Set(userFollows.map((follow) => follow.targetId));

  const nextByVenueId = mapNextUpcomingEventByVenueId(upcomingEvents.map((event) => ({ ...event, venueId: event.venueId! })));

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Venues</h1>
      <DiscoveryFilterBar assoc={filters.assoc} role={filters.role} assocCounts={assocCounts} roleCounts={roleCounts} />
      <ul className="grid gap-4 md:grid-cols-2">
        {items.map((venue) => {
          const coverUrl = resolveVenueCoverUrl(venue);
          const nextEvent = nextByVenueId.get(venue.id);

          return (
            <li key={venue.id} className="rounded border overflow-hidden bg-white">
              <Link href={`/venues/${venue.slug}`} className="block">
                <div className="relative aspect-[16/9] w-full bg-zinc-100">
                  {coverUrl ? (
                    <Image src={coverUrl} alt={venue.name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-sm text-zinc-500">No cover image</div>
                  )}
                </div>
                <div className="space-y-2 p-4">
                  <div className="space-y-1">
                    <h2 className="text-lg font-semibold">{venue.name}</h2>
                    <p className="text-sm text-zinc-500">{[venue.city, venue.region, venue.country].filter(Boolean).join(", ") || "Location unavailable"}</p>
                  </div>
                  <p className="text-sm text-zinc-600 line-clamp-2">{venue.description ?? "Discover upcoming art events at this venue."}</p>
                  {nextEvent ? (
                    <p className="text-sm text-zinc-700">
                      Next event: <span className="font-medium">{nextEvent.title}</span> · {nextEvent.startAt.toLocaleDateString()}
                    </p>
                  ) : (
                    <p className="text-sm text-zinc-500">No upcoming events</p>
                  )}
                </div>
              </Link>
              <div className="border-t px-4 py-3">
                <FollowButton
                  targetType="VENUE"
                  targetId={venue.id}
                  initialIsFollowing={followedVenueIds.has(venue.id)}
                  initialFollowersCount={followerCountByVenueId.get(venue.id) ?? 0}
                  isAuthenticated={Boolean(user)}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
