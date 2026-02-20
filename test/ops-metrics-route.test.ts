import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { GET } from "../app/api/ops/metrics/route.ts";
import { PERSONALIZATION_EXPOSURE_SAMPLE_RATE_PROD } from "../lib/personalization/tuning.ts";

test("ops metrics endpoint requires OPS_SECRET bearer token and returns no-store", async () => {
  process.env.OPS_SECRET = "ops-secret";

  const unauthorizedReq = new NextRequest("http://localhost:3000/api/ops/metrics");
  const unauthorizedRes = await GET(unauthorizedReq);
  assert.equal(unauthorizedRes.status, 401);
  assert.equal(unauthorizedRes.headers.get("Cache-Control"), "no-store");

  const authorizedReq = new NextRequest("http://localhost:3000/api/ops/metrics", {
    headers: { authorization: "Bearer ops-secret" },
  });
  const authorizedRes = await GET(authorizedReq);
  assert.equal(authorizedRes.status, 200);
  assert.equal(authorizedRes.headers.get("Cache-Control"), "no-store");
  const body = await authorizedRes.json();
  assert.equal(body.personalization.exposureSampleRateProd, PERSONALIZATION_EXPOSURE_SAMPLE_RATE_PROD);
});
