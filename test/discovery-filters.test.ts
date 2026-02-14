import assert from "node:assert/strict";
import test from "node:test";
import { parseDiscoveryFilters } from "../lib/discovery-filters";

test("invalid assoc falls back to any", () => {
  const parsed = parseDiscoveryFilters({ assoc: "unsupported" });
  assert.deepEqual(parsed, { assoc: "any" });
});

test("verified assoc normalizes role synonyms", () => {
  const parsed = parseDiscoveryFilters({ assoc: "verified", role: "represented" });
  assert.deepEqual(parsed, { assoc: "verified", role: "represented_by" });
});

test("exhibitions assoc ignores role", () => {
  const parsed = parseDiscoveryFilters({ assoc: "exhibitions", role: "resident" });
  assert.deepEqual(parsed, { assoc: "exhibitions" });
});
