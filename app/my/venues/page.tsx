import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { OnboardingPanel } from "@/components/onboarding/onboarding-panel";

export const dynamic = "force-dynamic";

export default async function MyVenuesPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const memberships = await db.venueMembership.findMany({
    where: { userId: user.id },
    include: {
      venue: {
        include: {
          targetSubmissions: {
            where: { type: "VENUE" },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const pendingInvites = await db.venueInvite.findMany({
    where: {
      email: user.email.toLowerCase(),
      status: "PENDING",
      expiresAt: { gt: new Date() },
    },
    include: {
      venue: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const hasNoMemberships = memberships.length === 0;
  const hasNoInvites = pendingInvites.length === 0;

  return (
    <main className="p-6 space-y-3">
      <h1 className="text-2xl font-semibold">My Venues</h1>
      <OnboardingPanel />

      {pendingInvites.length > 0 ? (
        <section className="space-y-2 rounded border bg-amber-50 p-4">
          <h2 className="text-lg font-semibold">Pending invites</h2>
          <ul className="space-y-2">
            {pendingInvites.map((invite) => (
              <li key={invite.id} className="rounded border bg-white p-3 text-sm">
                <p className="font-medium">{invite.venue.name}</p>
                <p className="text-neutral-600">Role: {invite.role}</p>
                <p className="mt-2"><Link className="underline" href={`/invite/${invite.token}`}>Review and accept invite</Link></p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {hasNoMemberships && hasNoInvites ? (
        <section className="rounded border bg-zinc-50 p-5 text-sm">
          <h2 className="text-lg font-semibold">You’re not part of any venue yet</h2>
          <p className="mt-2 text-zinc-700">Ask a venue owner to invite {user.email}, or start by creating a venue with an admin/editor.</p>
          <p className="mt-2 text-zinc-700">Need help? Share this email for invites: <span className="font-medium">{user.email}</span></p>
          <p className="mt-3"><Link className="underline" href="/my/venues/new">Create a venue</Link></p>
        </section>
      ) : (
        <ul className="space-y-2">
          {memberships.map((item) => (
            <li key={item.id} className="border rounded p-3">
              <div className="font-medium">{item.venue.name}</div>
              <div className="text-sm text-neutral-600">Role: {item.role}</div>
              {item.venue.targetSubmissions[0] ? (
                <div className="text-sm text-neutral-700">
                  Submission: {item.venue.targetSubmissions[0].status}
                  {item.venue.targetSubmissions[0].submittedAt ? ` • Submitted ${new Date(item.venue.targetSubmissions[0].submittedAt).toLocaleString()}` : ""}
                  {item.venue.targetSubmissions[0].decidedAt ? ` • Decided ${new Date(item.venue.targetSubmissions[0].decidedAt).toLocaleString()}` : ""}
                </div>
              ) : null}
              {item.venue.targetSubmissions[0]?.status === "REJECTED" && item.venue.targetSubmissions[0].decisionReason ? <div className="text-sm text-red-700">Reason: {item.venue.targetSubmissions[0].decisionReason}</div> : null}
              <div className="text-sm mt-2 space-x-3">
                <Link className="underline" href={`/my/venues/${item.venue.id}`}>Edit profile</Link>
                <Link className="underline" href={`/my/venues/${item.venue.id}/submit-event`}>Submit event</Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
