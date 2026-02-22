import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { redirectToLogin } from "@/lib/auth-redirect";

export default async function MyEventsPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const user = await getSessionUser();
  if (!user) redirectToLogin("/my/events");

  const { filter } = await searchParams;

  return (
    <main className="space-y-4 p-6">
      <h1 className="text-2xl font-semibold">My Events</h1>
      <p className="text-sm text-muted-foreground">Event creation is managed from your venues. Open a venue to submit an event.</p>
      {filter === "missingVenue" ? (
        <p className="rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">Events without a venue can be fixed by editing the event from the venue dashboard.</p>
      ) : null}
      <p><Link className="underline" href="/my/venues">Go to My Venues</Link></p>
    </main>
  );
}
