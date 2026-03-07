import { apiError } from "@/lib/api";
import { isAuthError, requireVenueRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { handleGetVenueStripeStatus } from "@/lib/stripe-connect-route";

export const runtime = "nodejs";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    return await handleGetVenueStripeStatus(params, {
      requireVenueRole,
      findVenueStripeAccount: (venueId) => db.stripeAccount.findUnique({
        where: { venueId },
        select: { status: true, chargesEnabled: true, payoutsEnabled: true },
      }),
    });
  } catch (error) {
    if (isAuthError(error)) return apiError(401, "unauthorized", "Authentication required");
    if (error instanceof Error && error.message === "forbidden") return apiError(403, "forbidden", "Venue membership required");
    return apiError(500, "internal_error", "Unexpected server error");
  }
}
