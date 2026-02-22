import Link from "next/link";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { redirectToLogin } from "@/lib/auth-redirect";
import { OnboardingPanel } from "@/components/onboarding/onboarding-panel";
import { hasDatabaseUrl } from "@/lib/runtime-db";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { CreateVenueForm } from "@/app/my/venues/_components/CreateVenueForm";
import { parseVenueFilter } from "@/lib/my-filters";

export const dynamic = "force-dynamic";

export default async function MyVenuesPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const user = await getSessionUser();
  if (!user) redirectToLogin("/my/venues");

  if (!hasDatabaseUrl()) {
    return (
      <main className="space-y-4 p-6">
        <PageHeader title="My Venues" subtitle="Manage your venues, members, and submission status." />
        <p>Set DATABASE_URL to manage venues locally.</p>
      </main>
    );
  }

  const { filter } = await searchParams;
  const parsedFilter = parseVenueFilter(filter);

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

  const filteredMemberships = memberships.filter((item) => {
    const latestStatus = item.venue.targetSubmissions[0]?.status;
    if (parsedFilter === "missingCover") return item.venue.featuredAssetId === null;
    if (parsedFilter === "needsEdits") return latestStatus === "REJECTED";
    if (parsedFilter === "submitted") return latestStatus === "SUBMITTED";
    return true;
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

  const hasNoMemberships = filteredMemberships.length === 0;
  const hasNoInvites = pendingInvites.length === 0;

  return (
    <main className="p-6 space-y-3">
      <PageHeader title="My Venues" subtitle="Manage your venues, members, and submission status." />
      <OnboardingPanel />

      {pendingInvites.length > 0 ? (
        <section className="space-y-2 rounded border bg-amber-50 p-4">
          <h2 className="text-lg font-semibold">Pending invites</h2>
          <ul className="space-y-2">
            {pendingInvites.map((invite) => (
              <li key={invite.id} className="rounded border bg-card p-3 text-sm">
                <p className="font-medium">{invite.venue.name}</p>
                <p className="text-neutral-600">Role: {invite.role}</p>
                <p className="mt-2"><Link className="underline" href={`/invite/${invite.token}`}>Review and accept invite</Link></p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {hasNoMemberships ? (
        hasNoInvites ? (
          <section className="space-y-3">
            <EmptyState
              title="Create a venue or join one"
              description="Create a venue to start posting events, or accept an invite."
              actions={[
                { label: "Browse venues", href: "/venues", variant: "secondary" },
                { label: "Check notifications", href: "/notifications", variant: "secondary" },
              ]}
            />
            <CreateVenueForm />
          </section>
        ) : (
          <section className="space-y-3">
            <p className="text-sm text-muted-foreground">No managed venues yet. You can still create your own venue draft now.</p>
            <CreateVenueForm />
          </section>
        )
      ) : (
        <>
          <div>
            <Button asChild variant="outline"><Link href="/my/venues/new">+ Create venue</Link></Button>
          </div>
          <ul className="space-y-2">
            {filteredMemberships.map((item) => (
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
        </>
      )}
    </main>
  );
}
