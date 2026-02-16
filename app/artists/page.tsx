import { ArtistCard } from "@/components/artists/artist-card";
import { DiscoveryFilterBar } from "@/components/discovery/discovery-filter-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { getSessionUser } from "@/lib/auth";
import { getArtistAssocCounts, getArtistRoleFacetCounts } from "@/lib/discovery-counts";
import { db } from "@/lib/db";
import { parseDiscoveryFilters } from "@/lib/discovery-filters";
import { hasDatabaseUrl } from "@/lib/runtime-db";

export const dynamic = "force-dynamic";

type ArtistsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ArtistsPage({ searchParams }: ArtistsPageProps) {
  const params = await searchParams;
  const filters = parseDiscoveryFilters(params);
  const user = await getSessionUser();

  if (!hasDatabaseUrl()) {
    return (
      <main className="p-6">
        <h1 className="mb-4 text-2xl font-semibold">Artists</h1>
        <DiscoveryFilterBar assoc={filters.assoc} role={filters.role} />
        <p className="mt-4">Set DATABASE_URL to view artists locally.</p>
      </main>
    );
  }

  const [items, assocCounts, roleCounts] = await Promise.all([
    db.artist.findMany({
      where: {
        isPublished: true,
        ...(filters.assoc === "verified"
          ? {
              venueAssociations: {
                some: {
                  status: "APPROVED",
                  ...(filters.role ? { role: filters.role } : {}),
                },
              },
            }
          : {}),
        ...(filters.assoc === "exhibitions"
          ? {
              eventArtists: {
                some: {
                  event: {
                    isPublished: true,
                  },
                },
              },
            }
          : {}),
        ...(filters.assoc === "none"
          ? {
              AND: [
                { venueAssociations: { none: { status: "APPROVED" } } },
                { eventArtists: { none: { event: { isPublished: true } } } },
              ],
            }
          : {}),
      },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        bio: true,
        avatarImageUrl: true,
        eventArtists: {
          where: { event: { isPublished: true } },
          take: 8,
          select: { event: { select: { eventTags: { select: { tag: { select: { slug: true } } } } } } },
        },
      },
    }),
    getArtistAssocCounts(db),
    getArtistRoleFacetCounts(db),
  ]);

  return (
    <main className="space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Artists</h1>
      <DiscoveryFilterBar assoc={filters.assoc} role={filters.role} assocCounts={assocCounts} roleCounts={roleCounts} />
      {items.length === 0 ? (
        <EmptyState
          title="No artists match these filters"
          description="Try broadening your filters or explore events and search."
          actions={[
            { label: "Browse events", href: "/events" },
            { label: "Search", href: "/search", variant: "secondary" },
          ]}
        />
      ) : null}
      <ul className="space-y-2">
        {items.map((artist) => {
          const tags = Array.from(new Set(artist.eventArtists.flatMap((row) => row.event.eventTags.map(({ tag }) => tag.slug)))).slice(0, 3);

          return (
          <li key={artist.id}>
            <ArtistCard
              href={`/artists/${artist.slug}`}
              name={artist.name}
              imageUrl={artist.avatarImageUrl}
              bio={artist.bio}
              tags={tags}
              isAuthenticated={Boolean(user)}
              artistId={artist.id}
            />
          </li>
          );
        })}
      </ul>
    </main>
  );
}
