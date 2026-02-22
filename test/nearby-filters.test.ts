import test from "node:test";
import assert from "node:assert/strict";
import { parseNearbyFilters, serializeNearbyFilters } from "../lib/nearby-filters.ts";

test("parseNearbyFilters defaults and normalizes", () => {
  const params = new URLSearchParams("q=  murals &tags=street-art,street-art,late&days=90&sort=distance");
  const parsed = parseNearbyFilters(params);
  assert.deepEqual(parsed, { q: "murals", tags: ["street-art", "late"], days: 90, from: "", to: "", sort: "distance" });
});

test("parseNearbyFilters keeps custom range and default days", () => {
  const params = new URLSearchParams("from=2026-03-01&to=2026-03-10&days=7");
  const parsed = parseNearbyFilters(params);
  assert.equal(parsed.from, "2026-03-01");
  assert.equal(parsed.to, "2026-03-10");
  assert.equal(parsed.days, 30);
});

test("serializeNearbyFilters omits defaults", () => {
  const params = serializeNearbyFilters({ q: "abc", tags: ["x"], days: 30, sort: "soonest" });
  assert.equal(params.get("q"), "abc");
  assert.equal(params.get("tags"), "x");
  assert.equal(params.get("days"), null);
  assert.equal(params.get("sort"), null);
});
