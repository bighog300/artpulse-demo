import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { GET as geocodeGet } from "../app/api/geocode/route.ts";

test("GET /api/geocode validates q length", async () => {
  const req = new NextRequest("http://localhost/api/geocode?q=ab");
  const res = await geocodeGet(req);
  assert.equal(res.status, 400);
});

test("GET /api/geocode returns 501 when mapbox is not configured", async () => {
  const previousToken = process.env.MAPBOX_ACCESS_TOKEN;
  delete process.env.MAPBOX_ACCESS_TOKEN;

  const req = new NextRequest("http://localhost/api/geocode?q=bristol");
  const res = await geocodeGet(req);
  const body = await res.json();

  assert.equal(res.status, 501);
  assert.deepEqual(body, { error: "not_configured" });

  if (previousToken == null) delete process.env.MAPBOX_ACCESS_TOKEN;
  else process.env.MAPBOX_ACCESS_TOKEN = previousToken;
});

test("GET /api/geocode returns 429 when rate limit exceeded", async () => {
  const previousLimit = process.env.RATE_LIMIT_GEOCODE_PER_MINUTE;
  const previousToken = process.env.MAPBOX_ACCESS_TOKEN;
  const originalFetch = global.fetch;

  process.env.RATE_LIMIT_GEOCODE_PER_MINUTE = "1";
  process.env.MAPBOX_ACCESS_TOKEN = "test-token";
  global.fetch = (async () => new Response(JSON.stringify({ features: [] }), { status: 200 })) as typeof fetch;

  const requestUrl = "http://localhost/api/geocode?q=london";
  const headers = { "x-forwarded-for": "198.51.100.10" };

  const first = await geocodeGet(new NextRequest(requestUrl, { headers }));
  const second = await geocodeGet(new NextRequest(requestUrl, { headers }));

  assert.equal(first.status, 200);
  assert.equal(second.status, 429);

  global.fetch = originalFetch;
  process.env.RATE_LIMIT_GEOCODE_PER_MINUTE = previousLimit;
  if (previousToken == null) delete process.env.MAPBOX_ACCESS_TOKEN;
  else process.env.MAPBOX_ACCESS_TOKEN = previousToken;
});
