import { getSessionUser } from "@/lib/auth";
import { hasDatabaseUrl } from "@/lib/runtime-db";
import { PageHeader } from "@/components/ui/page-header";
import { DataSourceEmptyState } from "@/components/ui/data-source-empty-state";
import { useUiFixtures as getUiFixturesEnabled, uiFixtureEvents } from "@/lib/ui-fixtures";
import { EventsClient } from "./events-client";

export const revalidate = 30;
const fixturesEnabled = getUiFixturesEnabled();

export default async function EventsPage() {
  const user = await getSessionUser();

  if (!hasDatabaseUrl()) {
    return (
      <main className="space-y-4 p-6">
        <PageHeader title="Events" subtitle="Discover what’s on near you" />
        {fixturesEnabled ? (
          <EventsClient isAuthenticated={Boolean(user)} fixtureItems={uiFixtureEvents} />
        ) : (
          <DataSourceEmptyState isAdmin={user?.role === "ADMIN"} showDevHint={process.env.NODE_ENV === "development"} />
        )}
      </main>
    );
  }

  return (
    <main className="space-y-4 p-6">
      <PageHeader title="Events" subtitle="Discover what’s on near you" />
      <EventsClient isAuthenticated={Boolean(user)} />
    </main>
  );
}
