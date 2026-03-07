import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { handlePostCheckin } from "@/lib/checkin-route";

type Status = "PENDING" | "CONFIRMED" | "WAITLISTED" | "CANCELLED";

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/checkin/event-1", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function makeDeps(options?: {
  status?: Status;
  checkedInAt?: Date | null;
  registrationEventId?: string;
  registrationFound?: boolean;
  isVenueMember?: boolean;
  authError?: boolean;
}) {
  return {
    requireAuth: async () => {
      if (options?.authError) throw new Error("unauthorized");
      return { id: "user-1" };
    },
    hasEventVenueMembership: async () => options?.isVenueMember ?? true,
    findRegistrationByConfirmationCode: async () => {
      if (options?.registrationFound === false) return null;
      return {
        id: "reg-1",
        eventId: options?.registrationEventId ?? "event-1",
        guestName: "Jane Doe",
        status: options?.status ?? "CONFIRMED",
        checkedInAt: options?.checkedInAt ?? null,
        tier: { name: "VIP" },
      };
    },
    setRegistrationCheckedInAt: async (_registrationId: string, checkedInAt: Date) => checkedInAt,
    now: () => new Date("2026-05-01T12:00:00.000Z"),
  };
}

test("successful check-in", async () => {
  const res = await handlePostCheckin(makeRequest({ confirmationCode: "AP-2X9K" }), "event-1", makeDeps());
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.ok, true);
  assert.equal(body.guestName, "Jane Doe");
  assert.equal(body.tierName, "VIP");
});

test("404 unknown code", async () => {
  const res = await handlePostCheckin(makeRequest({ confirmationCode: "AP-MISS" }), "event-1", makeDeps({ registrationFound: false }));
  assert.equal(res.status, 404);
});

test("400 wrong event", async () => {
  const res = await handlePostCheckin(makeRequest({ confirmationCode: "AP-WRONG" }), "event-1", makeDeps({ registrationEventId: "event-2" }));
  assert.equal(res.status, 400);
});

test("400 not confirmed", async () => {
  const res = await handlePostCheckin(makeRequest({ confirmationCode: "AP-WAIT" }), "event-1", makeDeps({ status: "WAITLISTED" }));
  assert.equal(res.status, 400);
});

test("409 already checked in", async () => {
  const res = await handlePostCheckin(makeRequest({ confirmationCode: "AP-DONE" }), "event-1", makeDeps({ checkedInAt: new Date("2026-05-01T10:00:00.000Z") }));
  assert.equal(res.status, 409);
});

test("venue member auth", async () => {
  const forbidden = await handlePostCheckin(makeRequest({ confirmationCode: "AP-2X9K" }), "event-1", makeDeps({ isVenueMember: false }));
  assert.equal(forbidden.status, 403);

  const unauthorized = await handlePostCheckin(makeRequest({ confirmationCode: "AP-2X9K" }), "event-1", makeDeps({ authError: true }));
  assert.equal(unauthorized.status, 401);
});
