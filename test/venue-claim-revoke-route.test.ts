import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("revoke route calls revokeClaim and returns ok", () => {
  const source = readFileSync("app/api/admin/venue-claims/[id]/revoke/route.ts", "utf8");
  assert.match(source, /await revokeClaim\(/);
  assert.match(source, /return Response\.json\(\{ ok: true \}\)/);
});

test("revoke route returns 404 on missing claim", () => {
  const source = readFileSync("app/api/admin/venue-claims/[id]/revoke/route.ts", "utf8");
  assert.match(source, /apiError\(404,\s*"not_found",\s*"Claim not found"\)/);
});

test("revoke route returns 403 when not admin", () => {
  const source = readFileSync("app/api/admin/venue-claims/[id]/revoke/route.ts", "utf8");
  assert.match(source, /await requireAdmin\(\{ redirectOnFail: false \}\)/);
  assert.match(source, /apiError\(403,\s*"forbidden",\s*"Admin role required"\)/);
});
