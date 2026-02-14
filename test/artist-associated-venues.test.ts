import test from "node:test";
import assert from "node:assert/strict";
import { dedupeAssociatedVenues } from "@/lib/artist-associated-venues";

test("dedupeAssociatedVenues removes duplicates across verified and derived", () => {
  const result = dedupeAssociatedVenues(
    [{ id: "v1", name: "Venue 1", slug: "venue-1" }],
    [
      { id: "v1", name: "Venue 1", slug: "venue-1" },
      { id: "v2", name: "Venue 2", slug: "venue-2" },
    ],
  );

  assert.equal(result.verified.length, 1);
  assert.equal(result.derived.length, 1);
  assert.equal(result.derived[0]?.id, "v2");
});
