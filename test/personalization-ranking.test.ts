import test from "node:test";
import assert from "node:assert/strict";
import { rankItems } from "../lib/personalization/ranking.ts";

test("rankItems applies weighting and hides hidden items", () => {
  const ranked = rankItems([
    { id: "hidden", title: "Hidden show", entityType: "event", venueSlug: "v0" },
    { id: "a", title: "Artist match", entityType: "event", artistSlugs: ["artist-1"], venueSlug: "v1" },
    { id: "b", title: "Venue match", entityType: "event", venueSlug: "venue-1" },
  ], {
    source: "for_you",
    signals: { followedArtistSlugs: ["artist-1"], followedVenueSlugs: ["venue-1"] },
    preferences: { hiddenItems: ["event:hidden"] },
  });

  assert.equal(ranked.some((item) => item.item.id === "hidden"), false);
  assert.equal(ranked[0]?.item.id, "b");
  assert.equal(ranked[0]?.score, 45);
  assert.equal(ranked[0]?.topReason, "followed_venue");
});

test("rankItems enforces top-10 venue cap and tag streak guard", () => {
  const input = [
    ...Array.from({ length: 4 }, (_, index) => ({
      id: `same-${index}`,
      title: `Same Venue ${index}`,
      entityType: "event" as const,
      venueSlug: "same-venue",
      tags: ["electronic"],
      sourceCategory: "trending" as const,
    })),
    ...Array.from({ length: 8 }, (_, index) => ({
      id: `other-${index}`,
      title: `Other ${index}`,
      entityType: "event" as const,
      venueSlug: `other-venue-${index}`,
      tags: [index % 2 === 0 ? "jazz" : "ambient"],
      sourceCategory: "follow" as const,
    })),
  ];

  const ranked = rankItems(input, { source: "for_you", preferences: {}, signals: {} });
  const topTen = ranked.slice(0, 10).map((entry) => entry.item);
  const sameVenueCount = topTen.filter((item) => item.venueSlug === "same-venue").length;

  assert.equal(sameVenueCount <= 2, true);

  for (let i = 0; i < ranked.length - 3; i += 1) {
    const run = ranked.slice(i, i + 4).map((entry) => entry.item.tags?.[0]).filter(Boolean);
    if (run.length === 4) assert.notEqual(new Set(run).size, 1);
  }
});
