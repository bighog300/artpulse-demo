import Link from "next/link";
import { DiscoveryFilterBar } from "@/components/discovery/discovery-filter-bar";
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
      select: { id: true, name: true, slug: true },
    }),
    getArtistAssocCounts(db),
    getArtistRoleFacetCounts(db),
  ]);

  return (
    <main className="space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Artists</h1>
      <DiscoveryFilterBar assoc={filters.assoc} role={filters.role} assocCounts={assocCounts} roleCounts={roleCounts} />
      {items.length === 0 ? <p className="rounded border border-dashed p-4 text-sm text-zinc-600">No artists published yet.</p> : null}
      <ul className="space-y-2">
        {items.map((artist) => (
          <li key={artist.id}>
            <Link className="underline" href={`/artists/${artist.slug}`}>
              {artist.name}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
