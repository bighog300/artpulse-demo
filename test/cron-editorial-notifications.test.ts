import test from "node:test";
import assert from "node:assert/strict";
import { runEditorialNotificationsCron } from "../lib/cron-editorial-notifications.ts";

test("cron rejects without matching secret", async () => {
  delete process.env.CRON_SECRET;
  const misconfigured = await runEditorialNotificationsCron("x", null, {} as never);
  assert.equal(misconfigured.status, 500);

  process.env.CRON_SECRET = "expected";
  const unauthorized = await runEditorialNotificationsCron("wrong", null, {} as never);
  assert.equal(unauthorized.status, 401);
});

test("dryRun returns candidates and does not write logs", async () => {
  process.env.CRON_SECRET = "secret";
  let created = 0;
  const fingerprints = new Set<string>();
  const db = {
    $queryRaw: async () => [{ locked: true }],
    $transaction: async (ops: any[]) => Promise.all(ops),
    user: { findMany: async () => [{ email: "admin@example.com" }] },
    curatedCollection: { findMany: async () => [] },
    editorialNotificationLog: {
      findUnique: async ({ where }: any) => (fingerprints.has(where.fingerprint) ? { id: "1" } : null),
      create: async ({ data }: any) => {
        created += 1;
        fingerprints.add(data.fingerprint);
        return { id: "1" };
      },
    },
  };

  const response = await runEditorialNotificationsCron("secret", "1", db as never, {}, {
    computeCandidates: async () => [{
      kind: "COLLECTION_EXPIRES_SOON",
      fingerprint: "f-1",
      subject: "subject",
      text: "text",
      payloadJson: {},
    }],
    resolveRecipients: async () => ["admin@example.com"],
    sink: { send: async () => { throw new Error("should not send"); } },
    logAdminActionFn: async () => {},
  });

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.sent, 0);
  assert.equal(body.details[0].status, "dry_run");
  assert.equal(created, 0);
});

test("non-dry-run writes log and dedupes on second run", async () => {
  process.env.CRON_SECRET = "secret";
  let sendCalls = 0;
  const fingerprints = new Set<string>();
  const db = {
    $queryRaw: async () => [{ locked: true }],
    $transaction: async (ops: any[]) => Promise.all(ops),
    user: { findMany: async () => [{ email: "admin@example.com" }] },
    curatedCollection: { findMany: async () => [] },
    editorialNotificationLog: {
      findUnique: async ({ where }: any) => (fingerprints.has(where.fingerprint) ? { id: "1" } : null),
      create: async ({ data }: any) => {
        fingerprints.add(data.fingerprint);
        return { id: "1" };
      },
    },
  };

  const deps = {
    computeCandidates: async () => [{
      kind: "COLLECTION_GOES_LIVE_SOON",
      fingerprint: "f-live",
      subject: "subject",
      text: "text",
      payloadJson: {},
    }],
    resolveRecipients: async () => ["admin@example.com"],
    sink: { send: async () => { sendCalls += 1; } },
    logAdminActionFn: async () => {},
  };

  const first = await runEditorialNotificationsCron("secret", null, db as never, {}, deps as never);
  const second = await runEditorialNotificationsCron("secret", null, db as never, {}, deps as never);

  const firstBody = await first.json();
  const secondBody = await second.json();

  assert.equal(firstBody.sent, 1);
  assert.equal(secondBody.sent, 0);
  assert.equal(secondBody.details[0].status, "skipped_already_sent");
  assert.equal(sendCalls, 1);
});
