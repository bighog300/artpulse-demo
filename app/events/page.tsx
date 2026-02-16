import { getSessionUser } from "@/lib/auth";
import { hasDatabaseUrl } from "@/lib/runtime-db";
import { PageHeader } from "@/components/ui/page-header";
import { EventsClient } from "./events-client";

export const revalidate = 30;

export default async function EventsPage() {
  if (!hasDatabaseUrl()) {
    return (
      <main className="p-6">
        <PageHeader title="Events" subtitle="Browse upcoming events near you and across the city." />
        <p className="pt-4">Set DATABASE_URL to view events locally.</p>
      </main>
    );
  }

  const user = await getSessionUser();

  return (
    <main className="space-y-4 p-6">
      <PageHeader
        title="Events"
        subtitle="Browse upcoming events near you and across the city."
      />
      <EventsClient isAuthenticated={Boolean(user)} />
    </main>
  );
}
