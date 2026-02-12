import Link from "next/link";
import { db } from "@/lib/db";
import SubmissionsModeration from "@/app/admin/_components/SubmissionsModeration";

export const dynamic = "force-dynamic";

const allowedStatuses = ["SUBMITTED", "APPROVED", "REJECTED"] as const;
type StatusFilter = (typeof allowedStatuses)[number];

export default async function AdminSubmissionsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const resolved = await searchParams;
  const inputStatus = typeof resolved.status === "string" ? resolved.status : "SUBMITTED";
  const status: StatusFilter = allowedStatuses.includes(inputStatus as StatusFilter) ? (inputStatus as StatusFilter) : "SUBMITTED";

  const items = await db.submission.findMany({
    where: { status },
    orderBy: [{ submittedAt: "desc" }, { createdAt: "desc" }],
    include: {
      submitter: { select: { email: true, name: true } },
      venue: { select: { id: true, name: true } },
      targetEvent: { select: { id: true, title: true, slug: true } },
      targetVenue: { select: { id: true, name: true, slug: true } },
    },
  });

  return (
    <main className="p-6 space-y-3">
      <h1 className="text-2xl font-semibold">Submission Moderation</h1>
      <div className="flex gap-2 text-sm">
        {allowedStatuses.map((s) => (
          <Link key={s} href={`/admin/submissions?status=${s}`} className={`rounded border px-3 py-1 ${s === status ? "bg-neutral-100" : ""}`}>
            {s[0]}{s.slice(1).toLowerCase()}
          </Link>
        ))}
      </div>
      <SubmissionsModeration
        items={items.map((item) => ({
          id: item.id,
          status: item.status,
          type: item.type,
          note: item.note,
          decisionReason: item.decisionReason,
          submittedAt: item.submittedAt?.toISOString() ?? null,
          decidedAt: item.decidedAt?.toISOString() ?? null,
          submitter: item.submitter,
          venue: item.venue,
          targetEvent: item.targetEvent,
          targetVenue: item.targetVenue,
        }))}
      />
    </main>
  );
}
