import { db } from "@/lib/db";
import SubmissionsModeration from "@/app/admin/_components/SubmissionsModeration";

export const dynamic = "force-dynamic";

export default async function AdminSubmissionsPage() {
  const items = await db.submission.findMany({
    where: { status: "SUBMITTED" },
    orderBy: { submittedAt: "asc" },
    include: {
      submitter: { select: { email: true, name: true } },
      targetEvent: { select: { title: true } },
      targetVenue: { select: { name: true } },
    },
  });

  return (
    <main className="p-6 space-y-3">
      <h1 className="text-2xl font-semibold">Submission Moderation</h1>
      <SubmissionsModeration
        items={items.map((item) => ({
          id: item.id,
          type: item.type,
          note: item.note,
          submittedAt: item.submittedAt?.toISOString() ?? null,
          submitter: item.submitter,
          targetEvent: item.targetEvent,
          targetVenue: item.targetVenue,
        }))}
      />
    </main>
  );
}
