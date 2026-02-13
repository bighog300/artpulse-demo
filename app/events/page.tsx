import Link from "next/link";
import { db } from "@/lib/db";
import { hasDatabaseUrl } from "@/lib/runtime-db";
import { EventCard } from "@/components/events/event-card";
import { PageHeader } from "@/components/ui/page-header";

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

  const items = await db.event.findMany({ where: { isPublished: true }, orderBy: { startAt: "asc" }, take: 100 });

  return (
    <main className="space-y-4 p-6">
      <PageHeader
        title="Events"
        subtitle="Browse upcoming events near you and across the city."
      />
      <p className="text-sm text-gray-700">Looking for something local? <Link className="underline" href="/nearby">Find events near you</Link>. Manage <Link className="underline" href="/saved-searches">saved searches</Link>.</p>
      <ul className="space-y-2">
        {items.map((e) => (
          <li key={e.id}>
            <EventCard
              href={`/events/${e.slug}`}
              title={e.title}
              startAt={e.startAt}
              endAt={e.endAt}

            />
          </li>
        ))}
      </ul>
    </main>
  );
}
