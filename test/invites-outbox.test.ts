import test from "node:test";
import assert from "node:assert/strict";
import type { VenueInvite, VenueMembership } from "@prisma/client";
import { acceptInviteWithDeps } from "../lib/invite-accept.service.ts";
import { submissionDecisionDedupeKey } from "../lib/notification-keys.ts";

function makeInvite(overrides: Partial<VenueInvite> = {}): VenueInvite {
  return {
    id: "invite-1",
    venueId: "venue-1",
    email: "invited@example.com",
    role: "EDITOR",
    token: "super-secure-token-12345",
    status: "PENDING",
    invitedByUserId: "user-1",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    expiresAt: new Date("2026-01-08T00:00:00.000Z"),
    acceptedAt: null,
    ...overrides,
  };
}

test("invite acceptance requires matching user email", async () => {
  const result = await acceptInviteWithDeps(
    {
      findInviteByToken: async () => makeInvite(),
      markInviteExpired: async () => assert.fail("should not mark expired"),
      upsertMembership: async () => assert.fail("should not create membership"),
      markInviteAccepted: async () => assert.fail("should not mark accepted"),
    },
    {
      token: "super-secure-token-12345",
      userId: "user-2",
      userEmail: "other@example.com",
      now: new Date("2026-01-02T00:00:00.000Z"),
    },
  );

  assert.equal(result.ok, false);
  assert.equal(result.code, "forbidden");
});

test("invite acceptance creates membership and is idempotent", async () => {
  const invite = makeInvite();
  const memberships = new Map<string, VenueMembership>();

  const deps = {
    findInviteByToken: async () => invite,
    markInviteExpired: async () => undefined,
    upsertMembership: async ({ userId, venueId, role }: { userId: string; venueId: string; role: VenueMembership["role"] }) => {
      const key = `${userId}:${venueId}`;
      const existing = memberships.get(key);
      if (existing) {
        const updated = { ...existing, role };
        memberships.set(key, updated);
        return updated;
      }
      const created: VenueMembership = {
        id: `membership-${memberships.size + 1}`,
        userId,
        venueId,
        role,
        createdAt: new Date("2026-01-02T00:00:00.000Z"),
      };
      memberships.set(key, created);
      return created;
    },
    markInviteAccepted: async () => {
      invite.status = "ACCEPTED";
      invite.acceptedAt = new Date("2026-01-02T00:00:00.000Z");
    },
  };

  const first = await acceptInviteWithDeps(deps, {
    token: invite.token,
    userId: "user-2",
    userEmail: invite.email,
    now: new Date("2026-01-02T00:00:00.000Z"),
  });

  const second = await acceptInviteWithDeps(deps, {
    token: invite.token,
    userId: "user-2",
    userEmail: invite.email,
    now: new Date("2026-01-02T00:00:01.000Z"),
  });

  assert.equal(first.ok, true);
  assert.equal(memberships.size, 1);
  assert.equal(second.ok, false);
  assert.equal(second.code, "invalid_state");
  assert.equal(memberships.size, 1);
});

test("outbox dedupe key is stable across repeated approve/reject calls", () => {
  const approvedOne = submissionDecisionDedupeKey("submission-1", "APPROVED");
  const approvedTwo = submissionDecisionDedupeKey("submission-1", "APPROVED");
  const rejected = submissionDecisionDedupeKey("submission-1", "REJECTED");

  assert.equal(approvedOne, approvedTwo);
  assert.notEqual(approvedOne, rejected);
});
