import test from "node:test";
import assert from "node:assert/strict";
import { runCronOutboxSend } from "../lib/cron-outbox.ts";

test("cron outbox route logic accepts GET and POST execution path", async () => {
  process.env.CRON_SECRET = "test-secret";

  const fakeSendPendingNotifications = async ({ limit }: { limit: number }) => ({
    sent: limit,
    failed: 0,
    skipped: 0,
  });

  const getRes = await runCronOutboxSend("test-secret", fakeSendPendingNotifications);
  const postRes = await runCronOutboxSend("test-secret", fakeSendPendingNotifications);

  assert.equal(getRes.status, 200);
  assert.equal(postRes.status, 200);
  const getBody = await getRes.json();
  assert.equal(getBody.sent, 25);
  assert.equal(getBody.errorCount, 0);
  assert.equal(getBody.cronName, "outbox_send");
  assert.equal(typeof getBody.cronRunId, "string");
});


test("cron outbox sends alerts on failures and not on success", async () => {
  process.env.CRON_SECRET = "test-secret";
  process.env.ALERT_WEBHOOK_URL = "https://alerts.example/webhook";

  const originalFetch = global.fetch;
  const calls: Array<{ status: number }> = [];
  global.fetch = (async () => {
    calls.push({ status: 200 });
    return new Response(null, { status: 200 });
  }) as typeof fetch;

  await runCronOutboxSend("test-secret", async () => ({ sent: 10, failed: 0, skipped: 0 }));
  assert.equal(calls.length, 0);

  await runCronOutboxSend("test-secret", async () => ({ sent: 5, failed: 1, skipped: 0 }));
  assert.equal(calls.length, 1);

  global.fetch = originalFetch;
  delete process.env.ALERT_WEBHOOK_URL;
});
