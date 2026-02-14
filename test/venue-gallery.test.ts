import assert from "node:assert/strict";
import test from "node:test";
import { resolveVenueGalleryAltText } from "@/lib/venue-gallery";

test("prefers explicit image alt text", () => {
  assert.equal(
    resolveVenueGalleryAltText({ imageAlt: "Room view", assetAlt: "Asset alt", venueName: "Studio" }),
    "Room view",
  );
});

test("falls back to asset alt text", () => {
  assert.equal(
    resolveVenueGalleryAltText({ imageAlt: null, assetAlt: "Asset alt", venueName: "Studio" }),
    "Asset alt",
  );
});

test("falls back to venue name", () => {
  assert.equal(resolveVenueGalleryAltText({ imageAlt: null, assetAlt: null, venueName: "Studio" }), "Studio image");
});
