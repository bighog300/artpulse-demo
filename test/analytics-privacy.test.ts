import test from "node:test";
import assert from "node:assert/strict";
import { POST } from "../app/api/analytics/route.ts";

function requestWithBody(body: unknown) {
  return new Request("http://localhost/api/analytics", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

test("analytics route rejects PII and sensitive location/query keys", async () => {
  const base = {
    name: "personalization_exposure",
    ts: new Date().toISOString(),
    path: "/events",
  };

  const blockedPayloads = [
    { ...base, props: { query: "secret" } },
    { ...base, props: { lat: 51.5, lng: -0.12 } },
    { ...base, props: { email: "user@example.com" } },
    { ...base, props: { name: "Jane" } },
  ];

  for (const payload of blockedPayloads) {
    const response = await POST(requestWithBody(payload));
    assert.equal(response.status, 400);
  }
});
