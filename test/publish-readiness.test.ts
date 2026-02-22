import test from "node:test";
import assert from "node:assert/strict";
import { evaluateArtistReadiness, evaluateVenueReadiness, evaluateEventReadiness, evaluateArtworkReadiness } from "@/lib/publish-readiness";

test("artist readiness blocks missing bio/avatar", () => {
  const readiness = evaluateArtistReadiness({ name: "Name", bio: "short", featuredAssetId: null, websiteUrl: null });
  assert.equal(readiness.ready, false);
  assert.equal(readiness.blocking.some((item) => item.id === "artist-bio"), true);
  assert.equal(readiness.blocking.some((item) => item.id === "artist-avatar"), true);
});

test("venue readiness blocks city/country/cover", () => {
  const readiness = evaluateVenueReadiness({ name: "Venue", city: null, country: null, featuredAssetId: null, websiteUrl: null });
  assert.equal(readiness.ready, false);
  assert.equal(readiness.blocking.some((item) => item.id === "venue-city"), true);
  assert.equal(readiness.blocking.some((item) => item.id === "venue-country"), true);
  assert.equal(readiness.blocking.some((item) => item.id === "venue-cover"), true);
});

test("event readiness blocks missing venue", () => {
  const readiness = evaluateEventReadiness({ title: "Event", startAt: new Date(), endAt: null, venueId: null }, null);
  assert.equal(readiness.ready, false);
  assert.equal(readiness.blocking.some((item) => item.id === "event-venue"), true);
});

test("artwork readiness blocks when no images and allows missing cover when image exists", () => {
  const blocked = evaluateArtworkReadiness({ title: "Work", featuredAssetId: null, medium: null, year: null }, []);
  assert.equal(blocked.ready, false);
  assert.equal(blocked.blocking.some((item) => item.id === "artwork-images"), true);

  const ready = evaluateArtworkReadiness({ title: "Work", featuredAssetId: null, medium: null, year: null }, [{ id: "img-1", assetId: "asset-1" }]);
  assert.equal(ready.ready, true);
});
