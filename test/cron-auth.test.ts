import test from "node:test";
import assert from "node:assert/strict";
import { runCronOutboxSend } from "../lib/cron-outbox.ts";

test("cron rejects missing secret header with 401 and generic message", async () => {
  process.env.CRON_SECRET = "test-secret";
  const res = await runCronOutboxSend(null, async () => ({ sent: 0, failed: 0, skipped: 0 }), { requestId: "req-1", method: "GET" });
  assert.equal(res.status, 401);
  const body = await res.json();
  assert.equal(body.error.code, "unauthorized");
  assert.equal(body.error.message, "Unauthorized");
});
