import test from "node:test";
import assert from "node:assert/strict";
import { unreadCountResponse } from "../lib/notifications-unread-count";

test("GET /api/notifications/unread-count requires authentication", async () => {
  const response = await unreadCountResponse({
    requireAuth: async () => {
      throw new Error("unauthorized");
    },
    countUnread: async () => 0,
  });

  assert.equal(response.status, 401);
});

test("GET /api/notifications/unread-count returns unread number", async () => {
  const response = await unreadCountResponse({
    requireAuth: async () => ({ id: "user-1", email: "user@example.com", role: "USER", name: null }),
    countUnread: async () => 7,
  });

  assert.equal(response.status, 200);
  const data = (await response.json()) as { unread: number };
  assert.equal(typeof data.unread, "number");
  assert.equal(data.unread, 7);
});
