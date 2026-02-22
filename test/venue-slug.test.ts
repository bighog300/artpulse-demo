import test from "node:test";
import assert from "node:assert/strict";
import { ensureUniqueVenueSlugWithDeps, slugifyVenueName, VenueSlugExhaustedError } from "../lib/venue-slug.ts";

test("slug helper normalizes name", () => {
  assert.equal(slugifyVenueName("  Café de l'Art  "), "cafe-de-l-art");
  assert.equal(slugifyVenueName("***"), "");
});

test("slug helper appends numeric suffixes for uniqueness", async () => {
  const existing = new Set(["my-venue", "my-venue-2"]);
  const slug = await ensureUniqueVenueSlugWithDeps(
    {
      findBySlug: async (candidate) => (existing.has(candidate) ? { id: candidate } : null),
    },
    "My Venue",
  );

  assert.equal(slug, "my-venue-3");
});

test("slug helper throws when attempts exhausted", async () => {
  await assert.rejects(
    () => ensureUniqueVenueSlugWithDeps({ findBySlug: async () => ({ id: "taken" }) }, "my venue", 2),
    VenueSlugExhaustedError,
  );
});
