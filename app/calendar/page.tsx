import { getSessionUser } from "@/lib/auth";
import { CalendarClient } from "@/app/calendar/calendar-client";
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

  const user = await getSessionUser();

  return (
    <main className="space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Calendar</h1>
      <CalendarClient isAuthenticated={Boolean(user)} />
    </main>
  );
}
