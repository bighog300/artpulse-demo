import { getSessionUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui/page-header";
import { PageShell } from "@/components/ui/page-shell";
import { ArtworkBrowser } from "@/app/artwork/artwork-browser";
import { CuratedCollectionsRail } from "@/components/artwork/curated-collections-rail";
import { TrendingRail } from "@/components/artwork/trending-rail";
import { getTrendingArtworks30 } from "@/lib/artworks";

export const dynamic = "force-dynamic";

type ArtworkPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function hasActiveArtworkFilters(params: Record<string, string | string[] | undefined>) {
  return Object.keys(params).some((key) => !["page", "sort"].includes(key));
}

export default async function ArtworkPage({ searchParams }: ArtworkPageProps) {
  const user = await getSessionUser();
  const resolvedSearchParams = (await searchParams) ?? {};
  const showTrendingRail = !hasActiveArtworkFilters(resolvedSearchParams);
  const trending = showTrendingRail ? await getTrendingArtworks30({ limit: 12 }) : [];

  return (
    <PageShell className="page-stack">
      <PageHeader title="Artwork" subtitle="Browse published works from artists across ArtPulse." />
      <CuratedCollectionsRail />
      {showTrendingRail ? <TrendingRail items={trending} /> : null}
      <ArtworkBrowser signedIn={Boolean(user)} />
    </PageShell>
  );
}
