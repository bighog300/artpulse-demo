import { getSessionUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui/page-header";
import { PageShell } from "@/components/ui/page-shell";
import { ArtworkBrowser } from "@/app/artwork/artwork-browser";
import { CuratedCollectionsRail } from "@/components/artwork/curated-collections-rail";

export const dynamic = "force-dynamic";

export default async function ArtworkPage() {
  const user = await getSessionUser();
  return (
    <PageShell className="page-stack">
      <PageHeader title="Artwork" subtitle="Browse published works from artists across ArtPulse." />
      <CuratedCollectionsRail />
      <ArtworkBrowser signedIn={Boolean(user)} />
    </PageShell>
  );
}
