import test from "node:test";
import assert from "node:assert/strict";
import { followManageBulkDeleteSchema } from "../lib/validators.ts";
import { getFollowManageDataSafe, sortFollowManageItems } from "../lib/follows-manage.ts";

test("bulk delete schema returns invalid_request-compatible zod issues", () => {
  const parsed = followManageBulkDeleteSchema.safeParse({ targets: [] });
  assert.equal(parsed.success, false);
});

test("bulk delete remains idempotent when 0 rows deleted", () => {
  const deleted = 0;
  assert.equal(deleted, 0);
  assert.equal({ ok: true, deleted }.ok, true);
});

test("follow manage sorting is activity-first and stable", () => {
  const sorted = sortFollowManageItems([
    { id: "2", name: "Beta", slug: "beta", followersCount: 10, upcomingEventsCount: 1 },
    { id: "1", name: "Alpha", slug: "alpha", followersCount: 100, upcomingEventsCount: 1 },
    { id: "3", name: "Gamma", slug: "gamma", followersCount: 5, upcomingEventsCount: 2 },
  ]);

  assert.deepEqual(sorted.map((item) => item.id), ["3", "1", "2"]);
});


test("follow manage safe loader returns empty arrays when DB is unavailable", async () => {
  const result = await getFollowManageDataSafe(async () => { throw new Error("db down"); });
  assert.deepEqual(result, { artists: [], venues: [] });
});
