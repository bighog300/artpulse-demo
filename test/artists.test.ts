import assert from "node:assert/strict";
import test from "node:test";
import { resolveArtistCoverUrl } from "@/lib/artists";
import { splitArtistEvents } from "@/lib/artist-events";

test("resolveArtistCoverUrl precedence", () => {
  assert.equal(resolveArtistCoverUrl({
    featuredAsset: { url: "https://asset.example/featured.jpg" },
    featuredImageUrl: "https://legacy.example/featured.jpg",
    images: [{ url: "https://gallery.example/1.jpg" }],
  }), "https://asset.example/featured.jpg");

  assert.equal(resolveArtistCoverUrl({
    featuredAsset: { url: null },
    featuredImageUrl: "https://legacy.example/featured.jpg",
    images: [{ url: "https://gallery.example/1.jpg" }],
  }), "https://legacy.example/featured.jpg");

  assert.equal(resolveArtistCoverUrl({
    featuredAsset: null,
    featuredImageUrl: null,
    images: [{ asset: { url: "https://gallery.example/from-asset.jpg" }, url: "https://gallery.example/fallback.jpg" }],
  }), "https://gallery.example/from-asset.jpg");
});

test("splitArtistEvents keeps startAt == now as upcoming", () => {
  const now = new Date("2026-03-01T12:00:00.000Z");
  const events = [
    { id: "past", startAt: new Date("2026-03-01T11:59:59.000Z") },
    { id: "boundary", startAt: new Date("2026-03-01T12:00:00.000Z") },
    { id: "future", startAt: new Date("2026-03-01T12:00:01.000Z") },
  ];

  const { upcoming, past } = splitArtistEvents(events, now);
  assert.deepEqual(upcoming.map((event) => event.id), ["boundary", "future"]);
  assert.deepEqual(past.map((event) => event.id), ["past"]);
});
