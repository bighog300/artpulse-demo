import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { handleEngagementPost } from "../lib/engagement-route.ts";

test("POST /api/engagement returns invalid_request for bad enum", async () => {
  const req = new NextRequest("http://localhost/api/engagement", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": "203.0.113.10" },
    body: JSON.stringify({ surface: "BAD", action: "VIEW", targetType: "EVENT", targetId: "evt-1" }),
  });

  const res = await handleEngagementPost(req, {
    getSessionUser: async () => null,
    createEvent: async () => undefined,
  });

  assert.equal(res.status, 400);
  const body = await res.json();
  assert.equal(body.error.code, "invalid_request");
});

test("POST /api/engagement stores sessionId when unauthenticated", async () => {
  const created: Array<Record<string, unknown>> = [];
  const req = new NextRequest("http://localhost/api/engagement", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": "203.0.113.11" },
    body: JSON.stringify({ surface: "SEARCH", action: "CLICK", targetType: "EVENT", targetId: "evt-1" }),
  });

  const res = await handleEngagementPost(req, {
    getSessionUser: async () => null,
    createEvent: async (input) => {
      created.push(input as unknown as Record<string, unknown>);
    },
  });

  assert.equal(res.status, 200);
  assert.equal(typeof created[0]?.sessionId, "string");
  assert.equal(created[0]?.userId, null);
});

test("POST /api/engagement stores userId when authenticated", async () => {
  const created: Array<Record<string, unknown>> = [];
  const req = new NextRequest("http://localhost/api/engagement", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": "203.0.113.12" },
    body: JSON.stringify({ surface: "DIGEST", action: "VIEW", targetType: "DIGEST_RUN", targetId: "a7fd9f4c-891d-4d31-af1e-68db9e077501" }),
  });

  const res = await handleEngagementPost(req, {
    getSessionUser: async () => ({ id: "user-1", email: "u@example.com", name: null, role: "USER" }),
    createEvent: async (input) => {
      created.push(input as unknown as Record<string, unknown>);
    },
  });

  assert.equal(res.status, 200);
  assert.equal(created[0]?.userId, "user-1");
  assert.equal(created[0]?.sessionId, null);
});

test("POST /api/engagement returns 429 when rate limit exceeded", async () => {
  const deps = {
    getSessionUser: async () => ({ id: "user-rl", email: "r@example.com", name: null, role: "USER" as const }),
    createEvent: async () => undefined,
  };

  let status = 200;
  for (let i = 0; i < 130; i += 1) {
    const request = new NextRequest("http://localhost/api/engagement", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": "203.0.113.13" },
      body: JSON.stringify({ surface: "NEARBY", action: "VIEW", targetType: "EVENT", targetId: `evt-${i}` }),
    });
    const response = await handleEngagementPost(request, deps);
    status = response.status;
    if (status === 429) break;
  }

  assert.equal(status, 429);
});
