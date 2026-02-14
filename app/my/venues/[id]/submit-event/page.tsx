import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { redirectToLogin } from "@/lib/auth-redirect";
import SubmitEventForm from "@/app/my/_components/SubmitEventForm";

export const dynamic = "force-dynamic";

export default async function SubmitEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) redirectToLogin("/my/venues");

  const membership = await db.venueMembership.findUnique({ where: { userId_venueId: { userId: user.id, venueId: id } } });
  if (!membership) notFound();

  const events = await db.event.findMany({ where: { venueId: id }, orderBy: { createdAt: "desc" } });
  const publishSubmissions = await db.submission.findMany({
    where: { venueId: id, type: "EVENT", OR: [{ kind: "PUBLISH" }, { kind: null }] },
    orderBy: { createdAt: "desc" },
  });
  const revisionSubmissions = await db.submission.findMany({
    where: { venueId: id, type: "EVENT", kind: "REVISION" },
    orderBy: { createdAt: "desc" },
  });

  const publishByEvent = new Map<string, (typeof publishSubmissions)[number]>();
  for (const item of publishSubmissions) {
    if (item.targetEventId && !publishByEvent.has(item.targetEventId)) publishByEvent.set(item.targetEventId, item);
  }
  const revisionByEvent = new Map<string, (typeof revisionSubmissions)[number]>();
  for (const item of revisionSubmissions) {
    if (item.targetEventId && !revisionByEvent.has(item.targetEventId)) revisionByEvent.set(item.targetEventId, item);
  }

  return (
    <main className="p-6 space-y-3">
      <h1 className="text-2xl font-semibold">Submit Event</h1>
      <SubmitEventForm
        venueId={id}
        existing={events.map((event) => {
          const publishSubmission = publishByEvent.get(event.id);
          const revision = revisionByEvent.get(event.id);
          return {
            eventId: event.id,
            status: publishSubmission?.status ?? "DRAFT",
            decisionReason: publishSubmission?.decisionReason ?? null,
            submittedAt: publishSubmission?.submittedAt?.toISOString() ?? null,
            decidedAt: publishSubmission?.decidedAt?.toISOString() ?? null,
            title: event.title,
            slug: event.slug,
            startAt: event.startAt.toISOString(),
            timezone: event.timezone,
            isPublished: event.isPublished,
            latestRevision: revision ? {
              id: revision.id,
              status: revision.status,
              decisionReason: revision.decisionReason,
              createdAt: revision.createdAt.toISOString(),
              decidedAt: revision.decidedAt?.toISOString() ?? null,
            } : null,
          };
        })}
      />
    </main>
  );
}
