import { CalendarClient } from "@/app/calendar/calendar-client";
import { db } from "@/lib/db";
import { hasDatabaseUrl } from "@/lib/runtime-db";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  if (!hasDatabaseUrl()) {
    return (
      <main className="p-6">
        <h1 className="mb-4 text-2xl font-semibold">Calendar</h1>
        <p>Set DATABASE_URL to view events locally.</p>
      </main>
    );
  }

  const items = await db.event.findMany({
    where: { isPublished: true },
    orderBy: { startAt: "asc" },
    take: 500,
    select: { id: true, title: true, slug: true, startAt: true, endAt: true },
  });

  return (
    <main className="p-6">
      <h1 className="mb-4 text-2xl font-semibold">Calendar</h1>
      <CalendarClient
        events={items.map((item) => ({
          id: item.id,
          title: item.title,
          slug: item.slug,
          start: item.startAt.toISOString(),
          end: item.endAt?.toISOString() ?? null,
        }))}
      />
    </main>
  );
}
