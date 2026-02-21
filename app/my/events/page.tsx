import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { redirectToLogin } from "@/lib/auth-redirect";

export default async function MyEventsPage() {
  const user = await getSessionUser();
  if (!user) redirectToLogin("/my/events");

  return (
    <main className="space-y-4 p-6">
      <h1 className="text-2xl font-semibold">My Events</h1>
      <p className="text-sm text-muted-foreground">Event creation is managed from your venues. Open a venue to submit an event.</p>
      <p><Link className="underline" href="/my/venues">Go to My Venues</Link></p>
    </main>
  );
}
