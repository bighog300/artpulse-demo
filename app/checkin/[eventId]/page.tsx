import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { redirectToLogin } from "@/lib/auth-redirect";
import { db } from "@/lib/db";
import CheckinClient from "./checkin-client";

export default async function CheckinPage({ params }: { params: Promise<{ eventId: string }> }) {
  const user = await getSessionUser();
  if (!user) redirectToLogin("/checkin");

  const { eventId } = await params;
  const event = await db.event.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      title: true,
      startAt: true,
      venue: {
        select: {
          memberships: {
            where: { userId: user.id },
            select: { id: true },
            take: 1,
          },
        },
      },
    },
  });

  if (!event || !event.venue || event.venue.memberships.length === 0) notFound();

  return (
    <main className="mx-auto max-w-2xl space-y-4 p-6">
      <CheckinClient eventId={event.id} eventTitle={event.title} eventDate={event.startAt.toISOString()} />
    </main>
  );
}
