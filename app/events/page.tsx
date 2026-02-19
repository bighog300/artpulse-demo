import { getSessionUser } from "@/lib/auth";
import { hasDatabaseUrl } from "@/lib/runtime-db";
import { PageHeader } from "@/components/ui/page-header";
import { PageShell } from "@/components/ui/page-shell";
import { DataSourceEmptyState } from "@/components/ui/data-source-empty-state";
import { useUiFixtures as getUiFixturesEnabled, uiFixtureEvents } from "@/lib/ui-fixtures";
import { EventsClient } from "./events-client";
import Link from "next/link";
import { OnboardingGate } from "@/components/onboarding/onboarding-gate";

export const revalidate = 30;
const fixturesEnabled = getUiFixturesEnabled();

export default async function EventsPage() {
  const user = await getSessionUser();
  const pageHeaderActions = <Link className="text-sm underline" href="/calendar">Go to Calendar</Link>;

  if (!hasDatabaseUrl()) {
    return (
      <PageShell className="page-stack">
        <PageHeader title="Events" subtitle="Discover what’s on near you" actions={pageHeaderActions} />
        <OnboardingGate page="events" isAuthenticated={Boolean(user)} />
        {fixturesEnabled ? (
          <EventsClient isAuthenticated={Boolean(user)} fixtureItems={uiFixtureEvents} fallbackFixtureItems={uiFixtureEvents} />
        ) : (
          <DataSourceEmptyState isAdmin={user?.role === "ADMIN"} showDevHint={process.env.NODE_ENV === "development"} />
        )}
      </PageShell>
    );
  }

  return (
    <PageShell className="page-stack">
      <PageHeader title="Events" subtitle="Discover what’s on near you" actions={pageHeaderActions} />
      <OnboardingGate page="events" isAuthenticated={Boolean(user)} />
      <EventsClient isAuthenticated={Boolean(user)} fallbackFixtureItems={fixturesEnabled ? uiFixtureEvents : undefined} />
    </PageShell>
  );
}
