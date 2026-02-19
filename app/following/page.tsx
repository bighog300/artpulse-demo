import Link from "next/link";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { hasDatabaseUrl } from "@/lib/runtime-db";
import { getFollowingFeedWithDeps, type FollowingFeedTypeFilter } from "@/lib/following-feed";
import { getFollowRecommendations } from "@/lib/recommendations-follows";
import { FollowButton } from "@/components/follows/follow-button";
import { redirectToLogin } from "@/lib/auth-redirect";
import { OnboardingPanel } from "@/components/onboarding/onboarding-panel";
import { setOnboardingFlag } from "@/lib/onboarding";
import { EmptyState } from "@/components/ui/empty-state";
import { EventCard } from "@/components/events/event-card";
import { PageHeader } from "@/components/ui/page-header";
import { PageShell } from "@/components/ui/page-shell";
import { SectionHeader } from "@/components/ui/section-header";
import { GetStartedBanner } from "@/components/onboarding/get-started-banner";

type SearchParams = Promise<{ days?: string; type?: string }>;

const DAY_OPTIONS: Array<{ value: "7" | "30"; label: string }> = [
  { value: "7", label: "Next 7 days" },
  { value: "30", label: "Next 30 days" },
];

const TYPE_OPTIONS: Array<{ value: FollowingFeedTypeFilter; label: string }> = [
  { value: "both", label: "Venues + Artists" },
  { value: "venue", label: "Venues only" },
  { value: "artist", label: "Artists only" },
];

export const dynamic = "force-dynamic";

export default async function FollowingPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireAuth().catch(() => redirectToLogin("/following"));

  if (!hasDatabaseUrl()) {
    return (
      <PageShell className="space-y-4">
        <PageHeader title="Following" subtitle="Upcoming events from artists and venues you follow." actions={<Link href="/following/manage" className="rounded border px-3 py-1 text-sm">Manage</Link>} />
        <p>Set DATABASE_URL to view events locally.</p>
      </PageShell>
    );
  }

  const params = await searchParams;
  const days: 7 | 30 = params.days === "30" ? 30 : 7;
  const type: FollowingFeedTypeFilter = params.type === "artist" || params.type === "venue" ? params.type : "both";

  const [result, followCount, recommendations] = await Promise.all([
    getFollowingFeedWithDeps(
      {
        now: () => new Date(),
        findFollows: async (userId) => db.follow.findMany({ where: { userId }, select: { targetType: true, targetId: true } }),
        findEvents: async ({ artistIds, venueIds, from, to, limit }) => db.event.findMany({
          where: {
            isPublished: true,
            startAt: { gte: from, lte: to },
            AND: [{
              OR: [
                ...(venueIds.length ? [{ venueId: { in: venueIds } }] : []),
                ...(artistIds.length ? [{ eventArtists: { some: { artistId: { in: artistIds } } } }] : []),
              ],
            }],
          },
          take: limit,
          orderBy: [{ startAt: "asc" }, { id: "asc" }],
          select: {
            id: true,
            slug: true,
            title: true,
            startAt: true,
            endAt: true,
            venue: { select: { name: true, slug: true } },
          },
        }),
      },
      { userId: user.id, days, type, limit: 50 },
    ),
    db.follow.count({ where: { userId: user.id } }),
    getFollowRecommendations({ userId: user.id, limit: 8 }),
    setOnboardingFlag(user.id, "hasVisitedFollowing"),
  ]);

  const hasNoFollows = followCount === 0;

  return (
    <PageShell className="space-y-4">
      <PageHeader title="Following" subtitle="Upcoming events from artists and venues you follow." actions={<Link href="/following/manage" className="rounded border px-3 py-1 text-sm">Manage</Link>} />
      <OnboardingPanel />
      <GetStartedBanner />
      <form className="flex flex-wrap items-center gap-3" method="get">
        <label className="text-sm">
          Timeframe
          <select className="ml-2 rounded border px-2 py-1" name="days" defaultValue={String(days)}>
            {DAY_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        <label className="text-sm">
          Source
          <select className="ml-2 rounded border px-2 py-1" name="type" defaultValue={type}>
            {TYPE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        <button type="submit" className="rounded border px-3 py-1 text-sm">Apply</button>
      </form>
      <p className="text-xs text-zinc-600">Tip: Save a search to get a weekly digest.</p>

      {hasNoFollows ? (
        <EmptyState
          title="Follow artists and venues to build your feed"
          description="Follow a few to see upcoming events here."
          actions={[
            { label: "Browse venues", href: "/venues", variant: "secondary" },
            { label: "Browse artists", href: "/artists", variant: "secondary" },
            { label: "Set location", href: "/account", variant: "secondary" },
          ]}
        />
      ) : (
        <section className="space-y-2">
          <SectionHeader title="Feed" />
          {result.items.length === 0 ? (
            <EmptyState
              title="Nothing upcoming yet"
              description="Try expanding the timeframe or follow more venues and artists."
              actions={[
                { label: "For You", href: "/for-you", variant: "secondary" },
                { label: "Saved searches", href: "/saved-searches", variant: "secondary" },
                { label: "Search", href: "/search", variant: "secondary" },
              ]}
            />
          ) : (
            <ul className="space-y-2">
              {result.items.map((item) => (
                <li key={item.id}>
                  <EventCard
                    href={`/events/${item.slug}`}
                    title={item.title}
                    startAt={item.startAt}
                    endAt={item.endAt}
                    venueName={item.venue?.name}
                    venueSlug={item.venue?.slug}
                    badges={[`From ${type === "both" ? "your follows" : `${type} follows`}`]}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section className="space-y-3">
        <SectionHeader title="Suggested follows" />

        {hasNoFollows ? <p className="text-sm text-gray-600">Suggested follows to get your feed started.</p> : null}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <h3 className="font-medium">Artists</h3>
            {recommendations.artists.length === 0 ? (
              <p className="text-sm text-gray-600">No artist suggestions right now.</p>
            ) : (
              recommendations.artists.map((artist) => (
                <article key={artist.id} className="rounded border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <Link className="font-medium underline" href={`/artists/${artist.slug}`}>{artist.name}</Link>
                      <p className="text-xs text-gray-600">{artist.reason}</p>
                    </div>
                    <FollowButton
                      targetType="ARTIST"
                      targetId={artist.id}
                      initialIsFollowing={false}
                      initialFollowersCount={artist.followersCount}
                      isAuthenticated
                    />
                  </div>
                </article>
              ))
            )}
          </div>

          <div className="space-y-2">
            <h3 className="font-medium">Venues</h3>
            {recommendations.venues.length === 0 ? (
              <p className="text-sm text-gray-600">No venue suggestions right now.</p>
            ) : (
              recommendations.venues.map((venue) => (
                <article key={venue.id} className="rounded border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <Link className="font-medium underline" href={`/venues/${venue.slug}`}>{venue.name}</Link>
                      <p className="text-xs text-gray-600">{venue.reason}</p>
                    </div>
                    <FollowButton
                      targetType="VENUE"
                      targetId={venue.id}
                      initialIsFollowing={false}
                      initialFollowersCount={venue.followersCount}
                      isAuthenticated
                    />
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </section>
    </PageShell>
  );
}
