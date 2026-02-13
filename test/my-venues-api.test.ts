import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { POST as postMyVenues } from "../app/api/my/venues/route.ts";

test("POST /api/my/venues requires authentication", async () => {
  const req = new NextRequest("http://localhost/api/my/venues", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "Test Venue" }),
  });

  const res = await postMyVenues(req);
  assert.equal(res.status, 401);
});
