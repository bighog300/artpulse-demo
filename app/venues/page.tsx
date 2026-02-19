import { VenuesClient } from "@/app/venues/venues-client";
import { DataSourceEmptyState } from "@/components/ui/data-source-empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { PageShell } from "@/components/ui/page-shell";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasDatabaseUrl } from "@/lib/runtime-db";
import { useUiFixtures as getUiFixturesEnabled, uiFixtureVenues } from "@/lib/ui-fixtures";
import { resolveVenueCoverUrl } from "@/lib/venues";

export const revalidate = 300;
const fixturesEnabled = getUiFixturesEnabled();

export default async function VenuesPage() {
  const user = await getSessionUser();

  if (!hasDatabaseUrl() && !fixturesEnabled) {
    return (
      <PageShell className="page-stack">
        <PageHeader title="Venues" subtitle="Find spaces for exhibitions, performances, and shows." />
        <DataSourceEmptyState isAdmin={user?.role === "ADMIN"} showDevHint={process.env.NODE_ENV === "development"} />
      </PageShell>
    );
  }

  let venues: Array<{ id: string; slug: string; name: string; subtitle: string; description: string | null; imageUrl: string | null; followersCount: number; isFollowing: boolean }> = [];

  if (hasDatabaseUrl()) {
    const dbVenues = await db.venue.findMany({
      where: { isPublished: true },
      orderBy: { name: "asc" },
      select: { id: true, slug: true, name: true, city: true, region: true, country: true, description: true, featuredImageUrl: true, featuredAsset: { select: { url: true } } },
    });
    const ids = dbVenues.map((venue) => venue.id);
    const [followerCounts, userFollows] = await Promise.all([
      ids.length ? db.follow.groupBy({ by: ["targetId"], where: { targetType: "VENUE", targetId: { in: ids } }, _count: { _all: true } }) : Promise.resolve([]),
      user && ids.length ? db.follow.findMany({ where: { userId: user.id, targetType: "VENUE", targetId: { in: ids } }, select: { targetId: true } }) : Promise.resolve([]),
    ]);
    const countById = new Map(followerCounts.map((entry) => [entry.targetId, entry._count._all]));
    const followedSet = new Set(userFollows.map((row) => row.targetId));

    venues = dbVenues.map((venue) => ({
      id: venue.id,
      slug: venue.slug,
      name: venue.name,
      subtitle: [venue.city, venue.region, venue.country].filter(Boolean).join(", ") || "Location unavailable",
      description: venue.description,
      imageUrl: resolveVenueCoverUrl(venue),
      followersCount: countById.get(venue.id) ?? 0,
      isFollowing: followedSet.has(venue.id),
    }));
  } else {
    venues = uiFixtureVenues.map((venue) => ({
      id: venue.id,
      slug: venue.slug,
      name: venue.name,
      subtitle: [venue.city, venue.region, venue.country].filter(Boolean).join(", ") || "Location unavailable",
      description: venue.description,
      imageUrl: resolveVenueCoverUrl(venue),
      followersCount: 0,
      isFollowing: false,
    }));
  }

  return (
    <PageShell className="page-stack">
      <PageHeader title="Venues" subtitle="Find spaces for exhibitions, performances, and shows." />
      <VenuesClient venues={venues} isAuthenticated={Boolean(user)} />
    </PageShell>
  );
}
