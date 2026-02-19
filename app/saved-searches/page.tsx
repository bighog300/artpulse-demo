import { getSessionUser } from "@/lib/auth";
import { SavedSearchesClient } from "@/components/saved-searches/saved-searches-client";
import { redirectToLogin } from "@/lib/auth-redirect";
import { hasDatabaseUrl } from "@/lib/runtime-db";
import { PageHeader } from "@/components/ui/page-header";
import { PageShell } from "@/components/ui/page-shell";
import { EmptyState } from "@/components/ui/empty-state";

export default async function SavedSearchesPage() {
  const user = await getSessionUser();
  if (!user) redirectToLogin("/saved-searches");

  if (!hasDatabaseUrl()) {
    return (
      <PageShell className="page-stack">
        <PageHeader title="Saved Searches" subtitle="Automate updates for what you care about" />
        <EmptyState title="Saved searches unavailable" description="Set DATABASE_URL to manage saved searches in local development." actions={[{ label: "Explore search", href: "/search", variant: "secondary" }]} />
      </PageShell>
    );
  }

  return (
    <PageShell className="page-stack">
      <PageHeader title="Saved Searches" subtitle="Automate updates for what you care about" />
      <SavedSearchesClient />
    </PageShell>
  );
}
