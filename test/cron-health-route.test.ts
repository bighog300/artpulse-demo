import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { GET } from "../app/api/cron/health/route.ts";

test("cron health returns snapshot and does not trigger alerts", async () => {
  process.env.CRON_SECRET = "cron-secret";
  process.env.ALERT_WEBHOOK_URL = "https://alerts.example/webhook";

  const originalFetch = global.fetch;
  let fetchCalls = 0;
  global.fetch = (async () => {
    fetchCalls += 1;
    return new Response(null, { status: 200 });
  }) as typeof fetch;

  const req = new NextRequest("http://localhost:3000/api/cron/health", {
    headers: { "x-cron-secret": "cron-secret" },
  });
  const response = await GET(req);

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  assert.equal(fetchCalls, 0);

  global.fetch = originalFetch;
  delete process.env.ALERT_WEBHOOK_URL;
});
