import test from "node:test";
import assert from "node:assert/strict";
import { handleGetVenueStripeStatus, handlePostVenueStripeConnect } from "@/lib/stripe-connect-route";

const VENUE_ID = "11111111-1111-4111-8111-111111111111";

function params() {
  return Promise.resolve({ id: VENUE_ID });
}

test("connect endpoint returns 400 when already connected", async () => {
  const res = await handlePostVenueStripeConnect(params(), {
    requireVenueRole: async () => null,
    findVenueStripeAccount: async () => ({ stripeAccountId: "acct_123", status: "ACTIVE", chargesEnabled: true, payoutsEnabled: true }),
    createVenueStripeAccount: async () => null,
    createExpressAccount: async () => ({ id: "acct_new" }),
    createAccountLink: async () => ({ url: "https://connect.stripe.com/onboarding" }),
    appUrl: "http://localhost:3000",
  });

  assert.equal(res.status, 400);
});

test("connect endpoint creates new stripe account and onboarding url", async () => {
  let createdStripeId: string | null = null;
  const res = await handlePostVenueStripeConnect(params(), {
    requireVenueRole: async () => null,
    findVenueStripeAccount: async () => null,
    createVenueStripeAccount: async ({ stripeAccountId }) => { createdStripeId = stripeAccountId; },
    createExpressAccount: async () => ({ id: "acct_created" }),
    createAccountLink: async ({ account, refreshUrl, returnUrl }) => {
      assert.equal(account, "acct_created");
      assert.match(refreshUrl, /\/my\/venues\/.+\/stripe\/refresh$/);
      assert.match(returnUrl, /\/my\/venues\/.+\/stripe\/return$/);
      return { url: "https://connect.stripe.com/onboarding/acct_created" };
    },
    appUrl: "http://localhost:3000",
  });

  assert.equal(createdStripeId, "acct_created");
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.url, "https://connect.stripe.com/onboarding/acct_created");
});

test("connect endpoint enforces OWNER auth", async () => {
  await assert.rejects(
    () => handlePostVenueStripeConnect(params(), {
      requireVenueRole: async (_venueId, role) => {
        assert.equal(role, "OWNER");
        throw new Error("forbidden");
      },
      findVenueStripeAccount: async () => null,
      createVenueStripeAccount: async () => null,
      createExpressAccount: async () => ({ id: "acct_created" }),
      createAccountLink: async () => ({ url: "https://connect.stripe.com/onboarding" }),
      appUrl: "http://localhost:3000",
    }),
    /forbidden/,
  );
});

test("status endpoint returns expected shape", async () => {
  const res = await handleGetVenueStripeStatus(params(), {
    requireVenueRole: async () => null,
    findVenueStripeAccount: async () => ({ status: "RESTRICTED", chargesEnabled: false, payoutsEnabled: true }),
  });

  assert.equal(res.status, 200);
  const body = await res.json();
  assert.deepEqual(body, {
    connected: false,
    status: "RESTRICTED",
    chargesEnabled: false,
    payoutsEnabled: true,
  });
});
