import { ArtistCard } from "@/components/artists/artist-card";
import { DiscoveryFilterBar } from "@/components/discovery/discovery-filter-bar";
import { CardGrid } from "@/components/ui/card-grid";
import { DataSourceEmptyState } from "@/components/ui/data-source-empty-state";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Section } from "@/components/ui/section";
import { getSessionUser } from "@/lib/auth";
import { getArtistAssocCounts, getArtistRoleFacetCounts, type AssocCounts, type RoleCounts } from "@/lib/discovery-counts";
import { db } from "@/lib/db";
import { parseDiscoveryFilters } from "@/lib/discovery-filters";
import { hasDatabaseUrl } from "@/lib/runtime-db";
import { uiFixtureArtists, useUiFixtures as getUiFixturesEnabled } from "@/lib/ui-fixtures";

export const dynamic = "force-dynamic";
const fixturesEnabled = getUiFixturesEnabled();

type ArtistsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type ArtistItem = {
  id: string;
  name: string;
  slug: string;
  bio: string | null;
  avatarImageUrl: string | null;
  tags?: string[];
  eventArtists: Array<{ event: { eventTags: Array<{ tag: { slug: string } }> } }>;
};

export default async function ArtistsPage({ searchParams }: ArtistsPageProps) {
  const params = await searchParams;
  const filters = parseDiscoveryFilters(params);
  const user = await getSessionUser();

  if (!hasDatabaseUrl() && !fixturesEnabled) {
    return (
      <main className="space-y-4 p-6">
        <PageHeader title="Artists" subtitle="Explore artists and track who to follow next." />
        <DiscoveryFilterBar assoc={filters.assoc} role={filters.role} />
        <DataSourceEmptyState isAdmin={user?.role === "ADMIN"} showDevHint={process.env.NODE_ENV === "development"} />
      </main>
    );
  }

  let items: ArtistItem[] = [];
  let assocCounts: AssocCounts | undefined;
  let roleCounts: RoleCounts | undefined;

  try {
    if (hasDatabaseUrl()) {
      const [dbItems, nextAssocCounts, nextRoleCounts] = await Promise.all([
        db.artist.findMany({
          where: {
            isPublished: true,
            ...(filters.assoc === "verified" ? { venueAssociations: { some: { status: "APPROVED", ...(filters.role ? { role: filters.role } : {}) } } } : {}),
            ...(filters.assoc === "exhibitions" ? { eventArtists: { some: { event: { isPublished: true } } } } : {}),
            ...(filters.assoc === "none" ? { AND: [{ venueAssociations: { none: { status: "APPROVED" } } }, { eventArtists: { none: { event: { isPublished: true } } } }] } : {}),
          },
          orderBy: { name: "asc" },
          select: { id: true, name: true, slug: true, bio: true, avatarImageUrl: true, eventArtists: { where: { event: { isPublished: true } }, take: 8, select: { event: { select: { eventTags: { select: { tag: { select: { slug: true } } } } } } } } },
        }),
        getArtistAssocCounts(db),
        getArtistRoleFacetCounts(db),
      ]);
      items = dbItems;
      assocCounts = nextAssocCounts;
      roleCounts = nextRoleCounts;
    } else if (fixturesEnabled) {
      items = uiFixtureArtists.map((artist) => ({ ...artist, eventArtists: [] }));
    }
  } catch {
    if (!fixturesEnabled) throw new Error("Failed to load artists");
    items = uiFixtureArtists.map((artist) => ({ ...artist, eventArtists: [] }));
  }

  const featured = items.slice(0, 4);

  return (
    <main className="space-y-4 p-6">
      <PageHeader title="Artists" subtitle="Explore artists and track who to follow next." />
      <Section title="Browse" subtitle="Filter artist profiles by verified associations and role.">
        <DiscoveryFilterBar assoc={filters.assoc} role={filters.role} assocCounts={assocCounts} roleCounts={roleCounts} />
      </Section>
      {featured.length > 0 ? (
        <Section title="Featured artists" subtitle="A short list of standout artist profiles.">
          <CardGrid columns={2}>
            <ul className="space-y-2">{featured.map((artist) => <ArtistListItem key={`featured-${artist.id}`} artist={artist} isAuthenticated={Boolean(user)} />)}</ul>
          </CardGrid>
        </Section>
      ) : null}
      <Section title="All artists">
        {items.length === 0 ? (
          <EmptyState title="No artists match these filters" description="Try broadening your filters or explore events and search." actions={[{ label: "Browse events", href: "/events" }, { label: "Search", href: "/search", variant: "secondary" }]} />
        ) : (
          <ul className="space-y-2">{items.map((artist) => <ArtistListItem key={artist.id} artist={artist} isAuthenticated={Boolean(user)} />)}</ul>
        )}
      </Section>
    </main>
  );
}

function ArtistListItem({ artist, isAuthenticated }: { artist: ArtistItem; isAuthenticated: boolean }) {
  const tags = artist.tags ?? Array.from(new Set(artist.eventArtists.flatMap((row) => row.event.eventTags.map(({ tag }) => tag.slug)))).slice(0, 3);

  return (
    <li>
      <ArtistCard href={`/artists/${artist.slug}`} name={artist.name} imageUrl={artist.avatarImageUrl} bio={artist.bio} tags={tags} isAuthenticated={isAuthenticated} artistId={artist.id} />
    </li>
  );
}
