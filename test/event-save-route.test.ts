import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { handleSaveEvent } from "../lib/event-save-route.ts";

const validEventId = "11111111-1111-4111-8111-111111111111";

test("POST /api/events/[id]/save succeeds for authenticated user", async () => {
  const saved: Array<{ userId: string; eventId: string }> = [];
  const req = new NextRequest(`http://localhost/api/events/${validEventId}/save`, { method: "POST" });

  const res = await handleSaveEvent(req, Promise.resolve({ id: validEventId }), {
    requireAuth: async () => ({ id: "user-1", email: "u@example.com", name: null, role: "USER" }),
    ensureEventExists: async () => true,
    saveEvent: async (input) => { saved.push(input); },
    unsaveEvent: async () => undefined,
  });

  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.ok, true);
  assert.equal(body.saved, true);
  assert.deepEqual(saved[0], { userId: "user-1", eventId: validEventId });
});

test("POST /api/events/[id]/save returns unauthorized when logged out", async () => {
  const req = new NextRequest(`http://localhost/api/events/${validEventId}/save`, { method: "POST" });

  const res = await handleSaveEvent(req, Promise.resolve({ id: validEventId }), {
    requireAuth: async () => { throw new Error("unauthorized"); },
    ensureEventExists: async () => true,
    saveEvent: async () => undefined,
    unsaveEvent: async () => undefined,
  });

  assert.equal(res.status, 401);
  const body = await res.json();
  assert.equal(body.error.code, "unauthorized");
});

test("POST /api/events/[id]/save returns invalid_request for invalid event id", async () => {
  const req = new NextRequest("http://localhost/api/events/not-a-uuid/save", { method: "POST" });

  const res = await handleSaveEvent(req, Promise.resolve({ id: "not-a-uuid" }), {
    requireAuth: async () => ({ id: "user-1", email: "u@example.com", name: null, role: "USER" }),
    ensureEventExists: async () => true,
    saveEvent: async () => undefined,
    unsaveEvent: async () => undefined,
  });

  assert.equal(res.status, 400);
  const body = await res.json();
  assert.equal(body.error.code, "invalid_request");
});
