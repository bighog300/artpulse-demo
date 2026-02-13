import assert from "node:assert/strict";
import test from "node:test";
import { buildArtistJsonLd, buildDetailMetadata, buildEventJsonLd, buildVenueJsonLd } from "../lib/seo.public-profiles.ts";

test("buildDetailMetadata returns fallback title and description", () => {
  const metadata = buildDetailMetadata({ kind: "event", slug: "missing-event" });

  assert.ok(metadata.title);
  assert.ok(metadata.description);
});

test("buildEventJsonLd maps event fields", () => {
  const jsonLd = buildEventJsonLd({
    title: "Gallery Night",
    description: "Opening reception",
    startAt: new Date("2026-03-01T19:00:00.000Z"),
    endAt: new Date("2026-03-01T22:00:00.000Z"),
    detailUrl: "https://example.com/events/gallery-night",
    imageUrl: "https://images.unsplash.com/photo-123",
    venue: { name: "Downtown Gallery", address: "123 Main St" },
  });

  assert.equal(jsonLd["@type"], "Event");
  assert.equal(jsonLd.location?.name, "Downtown Gallery");
  assert.equal(jsonLd.startDate, "2026-03-01T19:00:00.000Z");
  assert.equal(jsonLd.endDate, "2026-03-01T22:00:00.000Z");
});

test("buildVenueJsonLd and buildArtistJsonLd include expected schema types", () => {
  const venue = buildVenueJsonLd({
    name: "Canal Space",
    description: "Industrial venue",
    detailUrl: "https://example.com/venues/canal-space",
  });
  const artist = buildArtistJsonLd({
    name: "A. Painter",
    description: "Mixed media artist",
    detailUrl: "https://example.com/artists/a-painter",
  });

  assert.equal(venue["@type"], "Place");
  assert.equal(artist["@type"], "Person");
});
