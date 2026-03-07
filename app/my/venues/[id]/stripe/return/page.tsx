import Link from "next/link";
import { resolveVenueIdFromRouteParam } from "../../route-param";
import { db } from "@/lib/db";

async function getStripeStatus(venueId: string) {
  const stripeAccount = await db.stripeAccount.findUnique({
    where: { venueId },
    select: { status: true, chargesEnabled: true },
  });
  return {
    connected: stripeAccount?.status === "ACTIVE",
    chargesEnabled: stripeAccount?.chargesEnabled ?? false,
    status: stripeAccount?.status ?? null,
  };
}

export default async function VenueStripeReturnPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const routeVenue = await resolveVenueIdFromRouteParam(id, db);
  const venueId = routeVenue?.venueId ?? id;
  const status = await getStripeStatus(venueId);

  return (
    <main className="mx-auto max-w-2xl space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Stripe onboarding</h1>
      {status.chargesEnabled ? (
        <p className="rounded border border-emerald-300 bg-emerald-50 p-4 text-emerald-900">Success — your Stripe account is connected and can accept charges.</p>
      ) : (
        <p className="rounded border border-amber-300 bg-amber-50 p-4 text-amber-900">Your onboarding details were submitted, but your account is still under review.</p>
      )}
      <Link className="underline" href={`/my/venues/${venueId}`}>Back to venue dashboard</Link>
    </main>
  );
}
