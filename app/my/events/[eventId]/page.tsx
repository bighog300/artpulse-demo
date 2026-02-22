import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { redirectToLogin } from "@/lib/auth-redirect";
import { EditEventForm } from "@/app/my/events/[eventId]/page-client";

export default async function MyEventEditPage({ params }: { params: Promise<{ eventId: string }> }) {
  const user = await getSessionUser();
  if (!user) redirectToLogin("/my/events");

  const { eventId } = await params;

  const event = await db.event.findFirst({
    where: {
      id: eventId,
      OR: [
        { submissions: { some: { submitterUserId: user.id, type: "EVENT", OR: [{ kind: "PUBLISH" }, { kind: null }] } } },
        { venue: { memberships: { some: { userId: user.id, role: { in: ["OWNER", "EDITOR"] } } } } },
      ],
    },
    select: { id: true, title: true, startAt: true, endAt: true, venueId: true, isPublished: true },
  });

  if (!event) notFound();

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Edit event</h1>
      <EditEventForm event={event} />
    </main>
  );
}
