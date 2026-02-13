import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { hasDatabaseUrl } from "@/lib/runtime-db";
import { getFollowingFeedWithDeps, type FollowingFeedTypeFilter } from "@/lib/following-feed";
import { getFollowRecommendations } from "@/lib/recommendations-follows";
import { FollowButton } from "@/components/follows/follow-button";
import { OnboardingPanel } from "@/components/onboarding/onboarding-panel";
import { setOnboardingFlag } from "@/lib/onboarding";

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
  if (!hasDatabaseUrl()) {
    return (
      <main className="p-6">
        <h1 className="mb-4 text-2xl font-semibold">Following</h1>
        <p>Set DATABASE_URL to view events locally.</p>
      </main>
    );
  }

  let user;
  try {
    user = await requireAuth();
  } catch {
    redirect("/login");
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
    <main className="space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Following</h1>
      <OnboardingPanel />
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

      {hasNoFollows ? (
        <section className="rounded border bg-gray-50 p-5 text-sm">
          <h2 className="text-lg font-semibold text-gray-900">Your following feed is empty</h2>
          <p className="mt-2 text-gray-700">
            Follow artists and venues to build a personalized stream of upcoming events.
          </p>
          <p className="mt-2 text-gray-700">
            Discover from <Link className="underline" href="/events">events</Link>, <Link className="underline" href="/venues">venues</Link>, and <Link className="underline" href="/artists">artists</Link>.
          </p>
        </section>
      ) : (
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Feed</h2>
          {result.items.length === 0 ? (
            <p className="text-sm text-gray-600">No upcoming published events from your follows.</p>
          ) : (
          <ul className="space-y-2">
            {result.items.map((item) => (
              <li key={item.id} className="rounded border p-3">
                <Link className="font-medium underline" href={`/events/${item.slug}`}>{item.title}</Link>
                <p className="text-sm text-gray-600">
                  {item.startAt.toLocaleString()} {item.venue ? <>· <Link className="underline" href={`/venues/${item.venue.slug}`}>{item.venue.name}</Link></> : null}
                </p>
              </li>
            ))}
          </ul>
          )}
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Suggested follows</h2>

        {hasNoFollows ? <p className="text-sm text-gray-600">Suggested follows to get your feed started.</p> : null}

        <div className="grid gap-3 md:grid-cols-2">
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
    </main>
  );
}
