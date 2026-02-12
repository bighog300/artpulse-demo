import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { hasDatabaseUrl } from "@/lib/runtime-db";
import { getFollowingFeedWithDeps, type FollowingFeedTypeFilter } from "@/lib/following-feed";

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

  const result = await getFollowingFeedWithDeps(
    {
      now: () => new Date(),
      findFollows: async (userId) => db.follow.findMany({ where: { userId }, select: { targetType: true, targetId: true } }),
      findEvents: async ({ artistIds, venueIds, from, to, cursor, limit }) => db.event.findMany({
        where: {
          isPublished: true,
          startAt: { gte: from, lte: to },
          OR: [
            ...(venueIds.length ? [{ venueId: { in: venueIds } }] : []),
            ...(artistIds.length ? [{ eventArtists: { some: { artistId: { in: artistIds } } } }] : []),
          ],
        },
        take: limit,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
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
  );

  return (
    <main className="space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Following</h1>
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
    </main>
  );
}
