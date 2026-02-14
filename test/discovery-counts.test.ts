import assert from "node:assert/strict";
import test from "node:test";
import { bucketRoleFacetCounts, normalizeRoleFacetKey } from "../lib/discovery-counts";

test("normalizeRoleFacetKey maps null and unknown roles to other", () => {
  assert.equal(normalizeRoleFacetKey(null), "other");
  assert.equal(normalizeRoleFacetKey("legacy_role"), "other");
  assert.equal(normalizeRoleFacetKey("represented_by"), "represented_by");
});

test("bucketRoleFacetCounts accumulates counts and all total", () => {
  const counts = bucketRoleFacetCounts([
    { role: "represented_by", count: 2 },
    { role: "represented_by", count: 1 },
    { role: "legacy_unknown", count: 4 },
    { role: null, count: 3 },
  ]);

  assert.equal(counts.represented_by, 3);
  assert.equal(counts.other, 7);
  assert.equal(counts.all, 10);
  assert.equal(counts.exhibited_at, 0);
});
