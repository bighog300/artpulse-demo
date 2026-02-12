import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import VenueSelfServeForm from "@/app/my/_components/VenueSelfServeForm";
import VenueMembersManager from "@/app/my/_components/VenueMembersManager";

export default async function MyVenueEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const membership = await db.venueMembership.findUnique({
    where: { userId_venueId: { userId: user.id, venueId: id } },
    include: {
      venue: {
        include: {
          featuredAsset: { select: { url: true } },
          targetSubmissions: {
            where: { type: "VENUE" },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
          memberships: {
            include: {
              user: {
                select: { id: true, email: true, name: true },
              },
            },
            orderBy: [{ role: "desc" }, { createdAt: "asc" }],
          },
        },
      },
    },
  });

  if (!membership) notFound();

  const submission = membership.venue.targetSubmissions[0] ?? null;

  return (
    <main className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Edit Venue</h1>

      {submission ? (
        <section className="border rounded p-3 space-y-1">
          <h2 className="font-semibold">Submission status</h2>
          <p className="text-sm">Status: {submission.status}</p>
          {submission.submittedAt ? <p className="text-sm">Submitted: {submission.submittedAt.toLocaleString()}</p> : null}
          {submission.decidedAt ? <p className="text-sm">Decided: {submission.decidedAt.toLocaleString()}</p> : null}
          {submission.status === "REJECTED" && submission.decisionReason ? <p className="text-sm text-red-700">Reason: {submission.decisionReason}</p> : null}
        </section>
      ) : null}

      <VenueSelfServeForm venue={membership.venue} submissionStatus={submission?.status ?? null} />

      {(membership.role === "OWNER" || user.role === "ADMIN") ? (
        <VenueMembersManager
          venueId={membership.venue.id}
          members={membership.venue.memberships.map((m) => ({
            id: m.id,
            role: m.role,
            user: m.user,
          }))}
        />
      ) : null}
    </main>
  );
}
