import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import SubmitEventForm from "@/app/my/_components/SubmitEventForm";

export const dynamic = "force-dynamic";

export default async function SubmitEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const membership = await db.venueMembership.findUnique({ where: { userId_venueId: { userId: user.id, venueId: id } } });
  if (!membership) notFound();

  const submissions = await db.submission.findMany({
    where: { submitterUserId: user.id, venueId: id, type: "EVENT" },
    include: { targetEvent: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="p-6 space-y-3">
      <h1 className="text-2xl font-semibold">Submit Event</h1>
      <SubmitEventForm
        venueId={id}
        existing={submissions
          .filter((item) => item.targetEvent)
          .map((item) => ({
            eventId: item.targetEventId!,
            status: item.status,
            decisionReason: item.decisionReason,
            title: item.targetEvent!.title,
            slug: item.targetEvent!.slug,
            startAt: item.targetEvent!.startAt.toISOString(),
            timezone: item.targetEvent!.timezone,
          }))}
      />
    </main>
  );
}
