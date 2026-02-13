import test from "node:test";
import assert from "node:assert/strict";
import { canAccessSavedSearch } from "../lib/ownership.ts";
import { digestDedupeKey, isoWeekStamp } from "../lib/digest.ts";
import { normalizeSavedSearchParams } from "../lib/saved-searches.ts";
import { runWeeklyDigests } from "../lib/cron-digests.ts";

test("user scoping prevents access to other users saved searches", () => {
  assert.equal(canAccessSavedSearch("user-1", "user-2"), false);
  assert.equal(canAccessSavedSearch("user-1", "user-1"), true);
});

test("saved search params normalize and clamp schema", () => {
  const nearby = normalizeSavedSearchParams("NEARBY", { lat: 10, lng: 20, radiusKm: 500, days: 30, tags: ["art"] });
  assert.equal(nearby.radiusKm, 200);
  const filtered = normalizeSavedSearchParams("EVENTS_FILTER", { q: "painting", tags: ["modern"] });
  assert.equal(filtered.q, "painting");
  assert.deepEqual(filtered.tags, ["modern"]);
});

test("digest dedupe key stable by iso week", () => {
  const d = new Date("2026-02-09T10:00:00.000Z");
  assert.equal(isoWeekStamp(d), "2026-07");
  assert.equal(digestDedupeKey("abc", d), "digest:abc:2026-07");
});

test("cron secret enforcement returns 401/500", async () => {
  delete process.env.CRON_SECRET;
  const misconfigured = await runWeeklyDigests("x", { savedSearch: {} as never, notification: {} as never, event: {} as never });
  assert.equal(misconfigured.status, 500);
  process.env.CRON_SECRET = "secret";
  const unauthorized = await runWeeklyDigests("bad", { savedSearch: {} as never, notification: {} as never, event: {} as never });
  assert.equal(unauthorized.status, 401);
});

test("digest worker creates notification and updates lastSentAt only when results exist", async () => {
  process.env.CRON_SECRET = "secret";
  let updated = 0;
  let created = 0;
  const db = {
    savedSearch: {
      findMany: async () => ([
        { id: "s1", userId: "u1", name: "Has results", type: "EVENTS_FILTER" as const, paramsJson: { q: "x" }, lastSentAt: null },
        { id: "s2", userId: "u1", name: "No results", type: "EVENTS_FILTER" as const, paramsJson: { q: "none" }, lastSentAt: null },
      ]),
      update: async () => { updated += 1; return {}; },
    },
    notification: {
      upsert: async () => { created += 1; return {}; },
    },
    event: {
      findMany: async (args: any) => (JSON.stringify(args.where).includes("none") ? [] : [{ id: "e1", title: "T", slug: "t", startAt: new Date(), lat: null, lng: null, venue: null, eventTags: [] }]),
    },
  };

  const res = await runWeeklyDigests("secret", db as never);
  assert.equal(res.status, 200);
  assert.equal(created, 1);
  assert.equal(updated, 1);
});
