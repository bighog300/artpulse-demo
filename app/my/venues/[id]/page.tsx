import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { redirectToLogin } from "@/lib/auth-redirect";
import VenueSelfServeForm from "@/app/my/_components/VenueSelfServeForm";
import VenueMembersManager from "@/app/my/_components/VenueMembersManager";
import { PageHeader } from "@/components/ui/page-header";
import { hasDatabaseUrl } from "@/lib/runtime-db";
import { VenueGalleryManager } from "@/components/venues/venue-gallery-manager";
import { resolveImageUrl } from "@/lib/assets";

export default async function MyVenueEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) redirectToLogin("/my/venues");

  if (!hasDatabaseUrl()) {
    return (
      <main className="space-y-4 p-6">
        <PageHeader title="Edit Venue" subtitle="Update venue details and team access settings." />
        <p>Set DATABASE_URL to manage venues locally.</p>
      </main>
    );
  }

  const membership = await db.venueMembership.findUnique({
    where: { userId_venueId: { userId: user.id, venueId: id } },
    select: {
      role: true,
      venue: {
        select: {
          id: true,
          featuredImageUrl: true,
          featuredAssetId: true,
          isPublished: true,
          featuredAsset: { select: { url: true } },
          images: { select: { id: true, url: true, alt: true, sortOrder: true }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
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
          name: true,
          description: true,
          addressLine1: true,
          addressLine2: true,
          city: true,
          region: true,
          country: true,
          postcode: true,
          lat: true,
          lng: true,
          websiteUrl: true,
          instagramUrl: true,
        },
      },
    },
  });

  if (!membership) notFound();

  const submission = membership.venue.targetSubmissions[0] ?? null;

  return (
    <main className="space-y-6 p-6">
      <PageHeader title="Edit Venue" subtitle="Update venue details and team access settings." />

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

      <VenueGalleryManager
        venueId={membership.venue.id}
        initialImages={membership.venue.images}
        initialCover={{ featuredImageUrl: resolveImageUrl(membership.venue.featuredAsset?.url, membership.venue.featuredImageUrl) }}
      />

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
