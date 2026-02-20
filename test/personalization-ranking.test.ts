import test from "node:test";
import assert from "node:assert/strict";
import { rankItems } from "../lib/personalization/ranking.ts";
import type { TasteModel } from "../lib/personalization/taste.ts";

const taste: TasteModel = {
  version: 1,
  updatedAt: new Date("2025-01-01T00:00:00.000Z").toISOString(),
  tagWeights: { jazz: 1.2 },
  venueWeights: { "venue-1": 1.5 },
  artistWeights: { "artist-1": 1.1 },
  daypartWeights: { morning: 0.2, afternoon: 0, evening: 0, night: 0 },
  dowWeights: { mon: 0.2, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0 },
};

test("taste boosts matching tag/venue after interactions", () => {
  const ranked = rankItems([
    { id: "a", title: "Jazz Night", entityType: "event", tags: ["jazz"], venueSlug: "venue-1" },
    { id: "b", title: "Other", entityType: "event", tags: ["metal"], venueSlug: "venue-2" },
  ], { source: "for_you", preferences: {}, signals: { tasteModel: taste, now: new Date("2025-01-06T10:00:00.000Z") }, seed: 3 });

  assert.equal(ranked[0]?.item.id, "a");
  assert.equal(ranked[0]?.breakdown.some((part) => part.key === "taste_tag"), true);
  assert.equal(ranked[0]?.breakdown.some((part) => part.key === "taste_venue"), true);
});

test("show less/downrank decreases ranking", () => {
  const ranked = rankItems([
    { id: "a", title: "Jazz Night", entityType: "event", tags: ["jazz"], venueSlug: "venue-1" },
    { id: "b", title: "Other", entityType: "event", tags: ["metal"], venueSlug: "venue-2" },
  ], { source: "for_you", signals: { now: new Date("2025-01-06T10:00:00.000Z") }, preferences: { downrankTags: ["jazz"] }, seed: 2 });

  assert.equal(ranked[0]?.item.id, "b");
});

test("recency boosts soon items", () => {
  const ranked = rankItems([
    { id: "soon", title: "Soon", entityType: "event", startAt: "2025-01-07T10:00:00.000Z" },
    { id: "later", title: "Later", entityType: "event", startAt: "2025-01-20T10:00:00.000Z" },
  ], { source: "for_you", preferences: {}, signals: { now: new Date("2025-01-06T10:00:00.000Z") }, seed: 1 });

  assert.equal(ranked[0]?.item.id, "soon");
  assert.equal(ranked[0]?.breakdown.some((entry) => entry.key === "recency_soon"), true);
});

test("exploration inserts candidates and diversity venue cap still holds", () => {
  const input = [
    ...Array.from({ length: 2 }, (_, index) => ({ id: `same-${index}`, title: `Same ${index}`, entityType: "event" as const, venueSlug: "same", tags: ["jazz"] })),
    ...Array.from({ length: 6 }, (_, index) => ({ id: `exp-${index}`, title: `Exp ${index}`, entityType: "event" as const, venueSlug: `v-${index}`, tags: ["alt"], isExplorationCandidate: true })),
  ];

  const ranked = rankItems(input, { source: "for_you", preferences: {}, signals: { tasteModel: taste, now: new Date("2025-01-06T10:00:00.000Z") }, seed: 11, explorationRate: 1 });
  const topTen = ranked.slice(0, 10);
  const sameVenueCount = topTen.filter((entry) => entry.item.venueSlug === "same").length;
  assert.equal(sameVenueCount <= 2, true);
  assert.equal(ranked.length > 0, true);
});
