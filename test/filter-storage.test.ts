import test from "node:test";
import assert from "node:assert/strict";
import { buildActiveFilterChips, deserializeFilters, serializeFilters } from "../lib/filter-storage";

test("serialize and deserialize filters", () => {
  const value = serializeFilters({ days: "30", venue: "moma" });
  const parsed = deserializeFilters(value);
  assert.equal(parsed.days, "30");
  assert.equal(parsed.venue, "moma");
});

test("active filter chips are generated", () => {
  const chips = buildActiveFilterChips({ days: "30", venue: "", artist: "amy" });
  assert.deepEqual(chips.map((chip) => chip.key), ["days", "artist"]);
});
