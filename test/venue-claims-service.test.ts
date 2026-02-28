import test from "node:test";
import assert from "node:assert/strict";
import { createVenueClaim, verifyVenueClaim } from "../lib/venue-claims/service";

test("createVenueClaim uses manual review when contact email missing", async () => {
  const createdClaims: Array<Record<string, unknown>> = [];
  let claimStatus: string | null = null;

  const result = await createVenueClaim({
    slug: "venue-a",
    userId: "user-1",
    roleAtVenue: "Owner",
    db: {
      venue: {
        findUnique: async () => ({ id: "venue-1", slug: "venue-a", contactEmail: null, claimStatus: "UNCLAIMED" as const }),
        update: async ({ data }) => {
          claimStatus = data.claimStatus;
          return { id: "venue-1" };
        },
      },
      venueClaimRequest: {
        findFirst: async () => null,
        create: async ({ data }) => {
          createdClaims.push(data);
          return { id: "claim-1", status: "PENDING_VERIFICATION" as const, expiresAt: null, venueId: "venue-1" };
        },
        update: async () => ({ id: "claim-1" }),
      },
      venueMembership: { upsert: async () => ({ id: "membership-1" }) },
      $transaction: async (fn) => fn(this as never),
    } as never,
    notify: async () => {
      throw new Error("should not send");
    },
  });

  assert.equal(result.delivery, "MANUAL_REVIEW");
  assert.equal(claimStatus, "PENDING");
  assert.equal(createdClaims.length, 1);
});

test("verifyVenueClaim marks verified and returns redirect", async () => {
  let membershipUpserted = false;
  let venueClaimed = false;
  let claimVerified = false;

  const token = "x".repeat(48);
  const crypto = await import("node:crypto");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const tx = {
    venueClaimRequest: {
      findFirst: async () => ({ id: "claim-1", venueId: "venue-1", userId: "user-1" }),
      create: async () => ({ id: "claim-1", status: "PENDING_VERIFICATION" as const, expiresAt: null, venueId: "venue-1" }),
      update: async () => {
        claimVerified = true;
        return { id: "claim-1" };
      },
    },
    venueMembership: {
      upsert: async () => {
        membershipUpserted = true;
        return { id: "membership-1" };
      },
    },
    venue: {
      findUnique: async () => ({ id: "venue-1", slug: "venue-a", contactEmail: "v@example.com", claimStatus: "PENDING" as const }),
      update: async () => {
        venueClaimed = true;
        return { id: "venue-1" };
      },
    },
    $transaction: async (fn: (inner: never) => Promise<unknown>) => fn(tx as never),
  };

  const result = await verifyVenueClaim({
    db: {
      ...tx,
      venueClaimRequest: {
        ...tx.venueClaimRequest,
        findFirst: async ({ where }: { where: { tokenHash?: string } }) => {
          if (where.tokenHash && where.tokenHash !== tokenHash) return null;
          return { id: "claim-1", venueId: "venue-1", userId: "user-1" };
        },
      },
    } as never,
    slug: "venue-a",
    token,
  });

  assert.equal(result.status, "VERIFIED");
  assert.equal(result.redirectTo, "/my/venues/venue-1");
  assert.equal(membershipUpserted, true);
  assert.equal(venueClaimed, true);
  assert.equal(claimVerified, true);
});
