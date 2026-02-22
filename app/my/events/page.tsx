import Link from "next/link";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { redirectToLogin } from "@/lib/auth-redirect";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { CreateEventForm } from "@/app/my/events/_components/CreateEventForm";

export const dynamic = "force-dynamic";

export default async function MyEventsPage() {
  const user = await getSessionUser();
  if (!user) redirectToLogin("/my/events");

  const memberships = await db.venueMembership.findMany({
    where: { userId: user.id, role: { in: ["OWNER", "EDITOR"] } },
    select: { venueId: true, venue: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  const venueIds = memberships.map((item) => item.venueId);
  const events = await db.event.findMany({
    where: {
      OR: [
        { submissions: { some: { submitterUserId: user.id, type: "EVENT", OR: [{ kind: "PUBLISH" }, { kind: null }] } } },
        venueIds.length ? { venueId: { in: venueIds } } : {},
      ],
    },
    select: {
      id: true,
      title: true,
      startAt: true,
      isPublished: true,
      venue: { select: { name: true } },
      submissions: {
        where: { type: "EVENT", OR: [{ kind: "PUBLISH" }, { kind: null }] },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { status: true },
      },
    },
    orderBy: { startAt: "asc" },
  });

  const venues = memberships.map((item) => ({ id: item.venueId, name: item.venue.name }));

  return (
    <main className="p-6 space-y-4">
      <PageHeader title="My Events" subtitle="Create draft events and continue editing before submitting for review." />

      {events.length === 0 ? (
        <section className="space-y-3">
          <EmptyState title="Create your first event" description="Start with a draft and keep iterating before publishing." />
          <CreateEventForm venues={venues} />
        </section>
      ) : (
        <>
          <div>
            <Button asChild variant="outline"><Link href="/my/events/new">+ Create event</Link></Button>
          </div>
          <ul className="space-y-2">
            {events.map((event) => (
              <li key={event.id} className="rounded border p-3">
                <div className="font-medium">{event.title}</div>
                <div className="text-sm text-muted-foreground">{new Date(event.startAt).toLocaleString()} {event.venue?.name ? `• ${event.venue.name}` : "• No venue yet"}</div>
                <div className="text-sm">Status: {event.isPublished ? "Published" : event.submissions[0]?.status ?? "DRAFT"}</div>
                <p className="mt-2"><Link className="underline" href={`/my/events/${event.id}`}>Edit event</Link></p>
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
