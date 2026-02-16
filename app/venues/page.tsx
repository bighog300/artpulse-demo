import Image from "next/image";
import Link from "next/link";
import { DiscoveryFilterBar } from "@/components/discovery/discovery-filter-bar";
import { FollowButton } from "@/components/follows/follow-button";
import { CardGrid } from "@/components/ui/card-grid";
import { DataSourceEmptyState } from "@/components/ui/data-source-empty-state";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Section } from "@/components/ui/section";
import { getSessionUser, type SessionUser } from "@/lib/auth";
import { getVenueAssocCounts, getVenueRoleFacetCounts, type AssocCounts, type RoleCounts } from "@/lib/discovery-counts";
import { db } from "@/lib/db";
import { parseDiscoveryFilters } from "@/lib/discovery-filters";
import { hasDatabaseUrl } from "@/lib/runtime-db";
import { useUiFixtures as getUiFixturesEnabled, uiFixtureVenues } from "@/lib/ui-fixtures";
import { mapNextUpcomingEventByVenueId } from "@/lib/venue-events";
import { resolveVenueCoverUrl } from "@/lib/venues";

export const revalidate = 300;
const fixturesEnabled = getUiFixturesEnabled();

type VenuesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type VenueItem = {
  id: string;
  slug: string;
  name: string;
  city: string | null;
  region: string | null;
  country: string | null;
  description: string | null;
  featuredImageUrl: string | null;
  featuredAsset?: { url: string } | null;
};

type NextVenueEvent = { slug: string; title: string; startAt: Date };

export default async function VenuesPage({ searchParams }: VenuesPageProps) {
  const params = await searchParams;
  const filters = parseDiscoveryFilters(params);
  const user = await getSessionUser();

  if (!hasDatabaseUrl() && !fixturesEnabled) {
    return (
      <main className="space-y-4 p-6">
        <PageHeader title="Venues" subtitle="Find spaces hosting exhibitions, performances, and shows." />
        <DiscoveryFilterBar assoc={filters.assoc} role={filters.role} />
        <DataSourceEmptyState isAdmin={user?.role === "ADMIN"} showDevHint={process.env.NODE_ENV === "development"} />
      </main>
    );
  }

  let items: VenueItem[] = [];
  let assocCounts: AssocCounts | undefined;
  let roleCounts: RoleCounts | undefined;
  let nextByVenueId = new Map<string, NextVenueEvent>();
  let followerCountByVenueId = new Map<string, number>();
  let followedVenueIds = new Set<string>();

  try {
    if (hasDatabaseUrl()) {
      const [dbItems, nextAssocCounts, nextRoleCounts] = await Promise.all([
        db.venue.findMany({
          where: {
            isPublished: true,
            ...(filters.assoc === "verified" ? { artistAssociations: { some: { status: "APPROVED", ...(filters.role ? { role: filters.role } : {}) } } } : {}),
            ...(filters.assoc === "exhibitions" ? { events: { some: { isPublished: true, eventArtists: { some: {} } } } } : {}),
            ...(filters.assoc === "none" ? { AND: [{ artistAssociations: { none: { status: "APPROVED" } } }, { events: { none: { isPublished: true, eventArtists: { some: {} } } } }] } : {}),
          },
          orderBy: { name: "asc" },
          select: { id: true, slug: true, name: true, city: true, region: true, country: true, description: true, featuredImageUrl: true, featuredAsset: { select: { url: true } } },
        }),
        getVenueAssocCounts(db),
        getVenueRoleFacetCounts(db),
      ]);
      items = dbItems;
      assocCounts = nextAssocCounts;
      roleCounts = nextRoleCounts;

      const upcomingEvents = items.length > 0
        ? await db.event.findMany({ where: { isPublished: true, startAt: { gte: new Date() }, venueId: { in: items.map((venue) => venue.id), not: null } }, orderBy: [{ startAt: "asc" }, { id: "asc" }], select: { venueId: true, slug: true, title: true, startAt: true } })
        : [];
      nextByVenueId = mapNextUpcomingEventByVenueId(upcomingEvents.map((event) => ({ ...event, venueId: event.venueId! })));

      const venueIds = items.map((venue) => venue.id);
      const [followerCounts, userFollows] = await Promise.all([
        venueIds.length ? db.follow.groupBy({ by: ["targetId"], where: { targetType: "VENUE", targetId: { in: venueIds } }, _count: { _all: true } }) : Promise.resolve([]),
        user && venueIds.length ? db.follow.findMany({ where: { userId: user.id, targetType: "VENUE", targetId: { in: venueIds } }, select: { targetId: true } }) : Promise.resolve([]),
      ]);
      followerCountByVenueId = new Map(followerCounts.map((entry) => [entry.targetId, entry._count._all]));
      followedVenueIds = new Set(userFollows.map((follow) => follow.targetId));
    } else if (fixturesEnabled) {
      items = uiFixtureVenues;
    }
  } catch {
    if (!fixturesEnabled) throw new Error("Failed to load venues");
    items = uiFixtureVenues;
  }

  const featured = items.slice(0, 3);

  return (
    <main className="space-y-4 p-6">
      <PageHeader title="Venues" subtitle="Find spaces hosting exhibitions, performances, and shows." />
      <Section title="Browse" subtitle="Filter venues by verified associations and role.">
        <DiscoveryFilterBar assoc={filters.assoc} role={filters.role} assocCounts={assocCounts} roleCounts={roleCounts} />
      </Section>
      {featured.length > 0 ? (
        <Section title="Featured venues" subtitle="A quick shortlist of highlighted spaces.">
          <CardGrid columns={3}>
            {featured.map((venue) => <VenueListItem key={`featured-${venue.id}`} venue={venue} user={user} nextByVenueId={nextByVenueId} followerCountByVenueId={followerCountByVenueId} followedVenueIds={followedVenueIds} />)}
          </CardGrid>
        </Section>
      ) : null}
      <Section title="All venues">
        {items.length === 0 ? <EmptyState title="No venues match these filters" description="Try broadening filters or browse events." actions={[{ label: "Browse events", href: "/events" }]} /> : (
          <CardGrid columns={2}>
            {items.map((venue) => <VenueListItem key={venue.id} venue={venue} user={user} nextByVenueId={nextByVenueId} followerCountByVenueId={followerCountByVenueId} followedVenueIds={followedVenueIds} />)}
          </CardGrid>
        )}
      </Section>
    </main>
  );
}

function VenueListItem({ venue, user, nextByVenueId, followerCountByVenueId, followedVenueIds }: { venue: VenueItem; user: SessionUser | null; nextByVenueId: Map<string, NextVenueEvent>; followerCountByVenueId: Map<string, number>; followedVenueIds: Set<string> }) {
  const coverUrl = resolveVenueCoverUrl(venue);
  const nextEvent = nextByVenueId.get(venue.id);

  return (
    <article className="overflow-hidden rounded-lg border bg-white">
      <Link href={`/venues/${venue.slug}`} className="block">
        <div className="relative aspect-[16/9] w-full bg-zinc-100">
          {coverUrl ? <Image src={coverUrl} alt={venue.name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" /> : <div className="flex h-full items-center justify-center text-sm text-zinc-500">No cover image</div>}
        </div>
        <div className="space-y-2 p-4">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">{venue.name}</h2>
            <p className="text-sm text-zinc-500">{[venue.city, venue.region, venue.country].filter(Boolean).join(", ") || "Location unavailable"}</p>
          </div>
          <p className="line-clamp-2 text-sm text-zinc-600">{venue.description ?? "Discover upcoming art events at this venue."}</p>
          {nextEvent ? <p className="text-sm text-zinc-700">Next event: <span className="font-medium">{nextEvent.title}</span> · {nextEvent.startAt.toLocaleDateString()}</p> : <p className="text-sm text-zinc-500">No upcoming events</p>}
        </div>
      </Link>
      <div className="border-t px-4 py-3">
        <FollowButton targetType="VENUE" targetId={venue.id} initialIsFollowing={followedVenueIds.has(venue.id)} initialFollowersCount={followerCountByVenueId.get(venue.id) ?? 0} isAuthenticated={Boolean(user)} />
      </div>
    </article>
  );
}
