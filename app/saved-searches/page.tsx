import { getSessionUser } from "@/lib/auth";
import { SavedSearchesClient } from "@/components/saved-searches/saved-searches-client";
import { redirectToLogin } from "@/lib/auth-redirect";
import { hasDatabaseUrl } from "@/lib/runtime-db";
import { PageHeader } from "@/components/ui/page-header";
import { PageShell } from "@/components/ui/page-shell";

export default async function SavedSearchesPage() {
  const user = await getSessionUser();
  if (!user) redirectToLogin("/saved-searches");

  if (!hasDatabaseUrl()) {
    return (
      <PageShell className="space-y-4">
        <PageHeader title="Saved Searches" subtitle="Automate updates for what you care about" />
        <p className="text-sm text-muted-foreground">Set DATABASE_URL to manage saved searches locally.</p>
      </PageShell>
    );
  }

  return (
    <PageShell className="space-y-4">
      <PageHeader title="Saved Searches" subtitle="Automate updates for what you care about" />
      <SavedSearchesClient />
    </PageShell>
  );
}
