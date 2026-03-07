import { apiError } from "@/lib/api";
import { isAuthError, requireVenueRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { handlePostVenueStripeConnect } from "@/lib/stripe-connect-route";
import { getStripeClient } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    return await handlePostVenueStripeConnect(params, {
      requireVenueRole,
      findVenueStripeAccount: (venueId) => db.stripeAccount.findUnique({
        where: { venueId },
        select: { stripeAccountId: true, status: true, chargesEnabled: true, payoutsEnabled: true },
      }),
      createVenueStripeAccount: (input) => db.stripeAccount.create({ data: input }),
      createExpressAccount: async () => {
        const stripe = await getStripeClient();
        return stripe.accounts.create({ type: "express" });
      },
      createAccountLink: async ({ account, refreshUrl, returnUrl }) => {
        const stripe = await getStripeClient();
        return stripe.accountLinks.create({
          account,
          refresh_url: refreshUrl,
          return_url: returnUrl,
          type: "account_onboarding",
        });
      },
    });
  } catch (error) {
    if (isAuthError(error)) return apiError(401, "unauthorized", "Authentication required");
    if (error instanceof Error && error.message === "forbidden") return apiError(403, "forbidden", "Venue owner role required");
    return apiError(500, "internal_error", "Unexpected server error");
  }
}
