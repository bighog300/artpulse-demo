import { db } from "@/lib/db";
import { hasDatabaseUrl } from "@/lib/runtime-db";
import { eventsQuerySchema } from "@/lib/validators";
import { SearchSaveSearchInline } from "@/app/search/save-search-inline";
import { getSessionUser } from "@/lib/auth";
import { SearchResultsList } from "@/app/search/search-results-list";
import { SearchClient } from "@/app/search/search-client";

export const dynamic = "force-dynamic";

export default async function SearchPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await getSessionUser();
  const raw = await searchParams;
  const parsed = eventsQuerySchema.safeParse(Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])));
  const filters = parsed.success ? parsed.data : { limit: 20 };

  if (!hasDatabaseUrl()) {
    return (
      <main className="space-y-2 p-6">
        <h1 className="text-2xl font-semibold">Search</h1>
        {user ? <SearchSaveSearchInline /> : null}
        <p>Set DATABASE_URL to view events locally.</p>
      </main>
    );
  }

  const tagList = (filters.tags || "").split(",").map((t) => t.trim()).filter(Boolean);
  const items = await db.event.findMany({
    where: {
      isPublished: true,
      ...(filters.query ? { OR: [{ title: { contains: filters.query, mode: "insensitive" } }, { description: { contains: filters.query, mode: "insensitive" } }] } : {}),
      ...(filters.from || filters.to ? { startAt: { gte: filters.from ? new Date(filters.from) : undefined, lte: filters.to ? new Date(filters.to) : undefined } } : {}),
      ...(filters.venue ? { venue: { slug: filters.venue } } : {}),
      ...(filters.artist ? { eventArtists: { some: { artist: { slug: filters.artist, isPublished: true } } } } : {}),
      ...(tagList.length ? { eventTags: { some: { tag: { slug: { in: tagList } } } } } : {}),
    },
    take: filters.limit,
    orderBy: { startAt: "asc" },
    include: { venue: { select: { name: true, slug: true } } },
  });

  return (
    <main className="space-y-2 p-6">
      <h1 className="text-2xl font-semibold">Search</h1>
      <SearchClient filters={Object.fromEntries(Object.entries(filters).map(([k, v]) => [k, v == null ? "" : String(v)]))} />
      {user ? <SearchSaveSearchInline /> : null}
      <form className="grid gap-2 md:grid-cols-2">
        {[
          ["query", "Query"], ["from", "From (ISO)"], ["to", "To (ISO)"], ["days", "Days"], ["lat", "Latitude"], ["lng", "Longitude"], ["radiusKm", "Radius (km)"], ["tags", "Tags (comma slugs)"], ["venue", "Venue slug"], ["artist", "Artist slug"], ["limit", "Limit"],
        ].map(([name, label]) => (
          <label key={name} className="block">
            <span className="text-xs">{label}</span>
            <input name={name} defaultValue={String(filters[name as keyof typeof filters] ?? "")} className="w-full rounded border p-2" />
          </label>
        ))}
        <button className="w-fit rounded border px-3 py-2">Apply</button>
      </form>
      <SearchResultsList items={items.map((item) => ({ id: item.id, slug: item.slug, title: item.title, startAt: item.startAt.toISOString(), endAt: item.endAt?.toISOString(), venueName: item.venue?.name, venueSlug: item.venue?.slug }))} query={filters.query} />
    </main>
  );
}
