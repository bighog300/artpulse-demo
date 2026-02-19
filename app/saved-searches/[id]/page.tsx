import { getSessionUser } from "@/lib/auth";
import { SavedSearchRunner } from "@/components/saved-searches/saved-search-runner";
import { redirectToLogin } from "@/lib/auth-redirect";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { PageShell } from "@/components/ui/page-shell";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { db } from "@/lib/db";

export default async function SavedSearchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) redirectToLogin("/saved-searches");
  const routeParams = await params;
  const saved = await db.savedSearch.findFirst({ where: { id: routeParams.id, userId: user.id } });
  if (!saved) {
    return (
      <PageShell className="page-stack">
        <EmptyState title="Saved search not found" body="This saved search may have been deleted." actions={[{ label: "View details", href: "/saved-searches", variant: "secondary" }]} />
      </PageShell>
    );
  }

  return (
    <PageShell className="page-stack">
      <Breadcrumbs items={[{ label: "Saved Searches", href: "/saved-searches" }, { label: saved.name, href: `/saved-searches/${saved.id}` }]} />
      <PageHeader title={saved.name} subtitle={`${saved.type} · ${saved.frequency} · ${saved.isEnabled ? "Enabled" : "Disabled"}`} />
      <SavedSearchRunner id={saved.id} />
    </PageShell>
  );
}
