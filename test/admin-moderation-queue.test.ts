import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { handleAdminModerationQueue } from "../lib/admin-moderation-route";

test("non-admin gets 403", async () => {
  const res = await handleAdminModerationQueue(new NextRequest("http://localhost/api/admin/moderation/queue"), {
    requireAdminUser: async () => { throw new Error("forbidden"); },
    getQueueItems: async () => [],
  });
  assert.equal(res.status, 403);
});

test("admin queue returns submitted items only", async () => {
  const res = await handleAdminModerationQueue(new NextRequest("http://localhost/api/admin/moderation/queue"), {
    requireAdminUser: async () => ({ id: "admin-1", email: "admin@example.com" }),
    getQueueItems: async () => [{ entityType: "ARTIST", submissionId: "sub-1", entityId: "artist-1", title: "A", slug: "a", submittedAtISO: "2026-01-02T00:00:00.000Z" }],
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.items.length, 1);
  assert.equal(body.items[0].submissionId, "sub-1");
});

test("queue ordering by submittedAt desc", async () => {
  const items = [
    { entityType: "ARTIST", submissionId: "sub-older", entityId: "artist-1", title: "Older", slug: "older", submittedAtISO: "2026-01-01T00:00:00.000Z" },
    { entityType: "VENUE", submissionId: "sub-new", entityId: "venue-1", title: "New", slug: "new", submittedAtISO: "2026-01-03T00:00:00.000Z" },
  ] as const;

  const res = await handleAdminModerationQueue(new NextRequest("http://localhost/api/admin/moderation/queue"), {
    requireAdminUser: async () => ({ id: "admin-1", email: "admin@example.com" }),
    getQueueItems: async () => [...items].sort((a, b) => new Date(b.submittedAtISO).getTime() - new Date(a.submittedAtISO).getTime()),
  });

  const body = await res.json();
  assert.deepEqual(body.items.map((item: { submissionId: string }) => item.submissionId), ["sub-new", "sub-older"]);
});
