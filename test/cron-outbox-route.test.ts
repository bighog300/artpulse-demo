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
  assert.deepEqual(await getRes.json(), { sent: 25, failed: 0, skipped: 0 });
  assert.deepEqual(await postRes.json(), { sent: 25, failed: 0, skipped: 0 });
});
