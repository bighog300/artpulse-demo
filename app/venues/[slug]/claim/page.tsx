import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { redirectToLogin } from "@/lib/auth-redirect";
import { db } from "@/lib/db";
import { redactEmail } from "@/lib/venue-claims/service";
import { ClaimVenueForm } from "./venue-claim-form";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function VenueClaimPage({ params }: { params: Promise<{ slug: string }> }) {
  noStore();
  const user = await getSessionUser();
  const { slug } = await params;
  if (!user) redirectToLogin(`/venues/${slug}/claim`);

  const venue = await db.venue.findUnique({ where: { slug }, select: { id: true, name: true, slug: true, contactEmail: true, claimStatus: true } });
  if (!venue) redirect("/venues");
  if (venue.claimStatus === "CLAIMED") redirect(`/venues/${venue.slug}`);

  return (
    <main className="mx-auto max-w-2xl space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Claim {venue.name}</h1>
      <p className="text-sm text-muted-foreground">Submit your role and we’ll verify ownership before granting venue access.</p>
      {venue.contactEmail ? (
        <p className="text-sm">Verification email will be sent to <span className="font-medium">{redactEmail(venue.contactEmail)}</span>.</p>
      ) : (
        <p className="rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">This venue has no contact email. Your request will go to manual admin review.</p>
      )}
      <ClaimVenueForm slug={venue.slug} />
      <p className="text-xs text-muted-foreground"><Link href={`/venues/${venue.slug}`} className="underline">Back to venue</Link></p>
    </main>
  );
}
