import assert from "node:assert/strict";
import test from "node:test";
import { mapNextUpcomingEventByVenueId } from "@/lib/venue-events";
import { resolveVenueCoverUrl } from "@/lib/venues";

test("resolveVenueCoverUrl prefers featured asset URL", () => {
  assert.equal(resolveVenueCoverUrl({ featuredAsset: { url: "https://asset.example/a.jpg" }, featuredImageUrl: "https://legacy.example/a.jpg" }), "https://asset.example/a.jpg");
});

test("resolveVenueCoverUrl falls back to featuredImageUrl", () => {
  assert.equal(resolveVenueCoverUrl({ featuredAsset: { url: null }, featuredImageUrl: "https://legacy.example/a.jpg" }), "https://legacy.example/a.jpg");
});

test("resolveVenueCoverUrl returns null without cover", () => {
  assert.equal(resolveVenueCoverUrl({ featuredAsset: null, featuredImageUrl: null }), null);
});

test("mapNextUpcomingEventByVenueId keeps earliest event per venue", () => {
  const map = mapNextUpcomingEventByVenueId([
    { venueId: "v1", slug: "late", title: "Late", startAt: new Date("2026-01-03T10:00:00.000Z") },
    { venueId: "v1", slug: "early", title: "Early", startAt: new Date("2026-01-02T10:00:00.000Z") },
    { venueId: "v2", slug: "only", title: "Only", startAt: new Date("2026-01-04T10:00:00.000Z") },
  ]);

  assert.equal(map.get("v1")?.slug, "early");
  assert.equal(map.get("v2")?.slug, "only");
});
