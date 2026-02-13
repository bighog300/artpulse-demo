import test from "node:test";
import assert from "node:assert/strict";
import { runEngagementRetentionCron } from "../lib/cron-engagement-retention.ts";

test("retention cron rejects when CRON_SECRET missing or mismatched", async () => {
  delete process.env.CRON_SECRET;
  const misconfigured = await runEngagementRetentionCron("secret", {}, { engagementEvent: { count: async () => 0, deleteMany: async () => ({ count: 0 }) } });
  assert.equal(misconfigured.status, 500);

  process.env.CRON_SECRET = "expected";
  const mismatch = await runEngagementRetentionCron("wrong", {}, { engagementEvent: { count: async () => 0, deleteMany: async () => ({ count: 0 }) } });
  assert.equal(mismatch.status, 401);
});

test("retention dryRun returns wouldDelete count", async () => {
  process.env.CRON_SECRET = "secret";
  const response = await runEngagementRetentionCron("secret", { dryRun: "true", keepDays: "90" }, {
    engagementEvent: {
      count: async () => 42,
      deleteMany: async () => ({ count: 0 }),
    },
  });

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.dryRun, true);
  assert.equal(body.wouldDelete, 42);
});

test("retention delete path calls deleteMany with computed cutoff", async () => {
  process.env.CRON_SECRET = "secret";
  const realNow = Date.now;
  Date.now = () => new Date("2026-03-01T00:00:00.000Z").getTime();
  let cutoffIso = "";

  const response = await runEngagementRetentionCron("secret", { dryRun: "false", keepDays: "30" }, {
    engagementEvent: {
      count: async () => 0,
      deleteMany: async (args) => {
        cutoffIso = args.where.createdAt.lt.toISOString();
        return { count: 9 };
      },
    },
  });

  Date.now = realNow;
  assert.equal(response.status, 200);
  assert.equal(cutoffIso, "2026-01-30T00:00:00.000Z");
  const body = await response.json();
  assert.equal(body.deleted, 9);
  assert.equal(body.dryRun, false);
});
