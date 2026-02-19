import { getSessionUser } from "@/lib/auth";
import { hasDatabaseUrl } from "@/lib/runtime-db";
import { PageHeader } from "@/components/ui/page-header";
import { PageShell } from "@/components/ui/page-shell";
import { DataSourceEmptyState } from "@/components/ui/data-source-empty-state";
import { useUiFixtures as getUiFixturesEnabled, uiFixtureEvents } from "@/lib/ui-fixtures";
import { EventsClient } from "./events-client";
import Link from "next/link";

export const revalidate = 30;
const fixturesEnabled = getUiFixturesEnabled();

export default async function EventsPage() {
  const user = await getSessionUser();
  const pageHeaderActions = <Link className="text-sm underline" href="/calendar">Go to Calendar</Link>;

  if (!hasDatabaseUrl()) {
    return (
      <PageShell className="space-y-4">
        <PageHeader title="Events" subtitle="Discover what’s on near you" actions={pageHeaderActions} />
        {fixturesEnabled ? (
          <EventsClient isAuthenticated={Boolean(user)} fixtureItems={uiFixtureEvents} fallbackFixtureItems={uiFixtureEvents} />
        ) : (
          <DataSourceEmptyState isAdmin={user?.role === "ADMIN"} showDevHint={process.env.NODE_ENV === "development"} />
        )}
      </PageShell>
    );
  }

  return (
    <PageShell className="space-y-4">
      <PageHeader title="Events" subtitle="Discover what’s on near you" actions={pageHeaderActions} />
      <EventsClient isAuthenticated={Boolean(user)} fallbackFixtureItems={fixturesEnabled ? uiFixtureEvents : undefined} />
    </PageShell>
  );
}
