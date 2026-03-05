import test from "node:test";
import assert from "node:assert/strict";
import {
  extractJsonLdBlocks,
  extractJsonLdEvents,
  flattenJsonLdGraph,
  isJsonLdEvent,
  mapJsonLdEventToNormalized,
} from "@/lib/ingest/jsonld-extract";

test("extractJsonLdBlocks returns empty array when no ld+json scripts", () => {
  assert.deepEqual(extractJsonLdBlocks("<html><body><h1>No structured data</h1></body></html>"), []);
});

test("extractJsonLdBlocks parses single object", () => {
  const html = '<script type="application/ld+json">{"@type":"Event","name":"A","startDate":"2026-01-01T10:00:00Z"}</script>';
  const blocks = extractJsonLdBlocks(html);
  assert.equal(blocks.length, 1);
  assert.equal((blocks[0] as { name: string }).name, "A");
});

test("extractJsonLdBlocks parses top-level array", () => {
  const html = '<script type="application/ld+json">[{"@type":"Event","name":"A","startDate":"2026-01-01T10:00:00Z"},{"@type":"Event","name":"B","startDate":"2026-01-02T10:00:00Z"}]</script>';
  const blocks = extractJsonLdBlocks(html);
  assert.equal(blocks.length, 2);
});

test("extractJsonLdBlocks skips malformed block and continues", () => {
  const html = `
    <script type="application/ld+json">{ this is not json }</script>
    <script type="application/ld+json">{"@type":"Event","name":"Valid","startDate":"2026-01-01T10:00:00Z"}</script>
  `;
  const blocks = extractJsonLdBlocks(html);
  assert.equal(blocks.length, 1);
  assert.equal((blocks[0] as { name: string }).name, "Valid");
});

test("flattenJsonLdGraph passthrough for plain object", () => {
  const input = { "@type": "Event", name: "A" };
  assert.deepEqual(flattenJsonLdGraph(input), [input]);
});

test("flattenJsonLdGraph unwraps single @graph", () => {
  const input = { "@graph": [{ "@type": "Event", name: "A" }] };
  assert.equal(flattenJsonLdGraph(input).length, 1);
});

test("flattenJsonLdGraph unwraps nested @graph", () => {
  const input = {
    "@graph": [
      {
        "@graph": [{ "@type": "Event", name: "Nested" }],
      },
    ],
  };
  const flattened = flattenJsonLdGraph(input);
  assert.equal(flattened.length, 1);
  assert.equal((flattened[0] as { name: string }).name, "Nested");
});

test("isJsonLdEvent recognizes supported types", () => {
  assert.equal(isJsonLdEvent({ "@type": "Event" }), true);
  assert.equal(isJsonLdEvent({ "@type": "ExhibitionEvent" }), true);
  assert.equal(isJsonLdEvent({ "@type": "VisualArtEvent" }), true);
  assert.equal(isJsonLdEvent({ "@type": "SocialEvent" }), true);
  assert.equal(isJsonLdEvent({ "@type": ["Thing", "TheaterEvent"] }), true);
  assert.equal(isJsonLdEvent({ "@type": "Organization" }), false);
  assert.equal(isJsonLdEvent({ "@type": "BreadcrumbList" }), false);
  assert.equal(isJsonLdEvent({ name: "Missing type" }), false);
});

test("mapJsonLdEventToNormalized maps valid event", () => {
  const mapped = mapJsonLdEventToNormalized(
    {
      "@type": "Event",
      name: "  Summer Opening  ",
      startDate: "2026-07-01T19:00:00+01:00",
      endDate: "2026-07-01T21:00:00+01:00",
      description: "  Description ",
      url: "https://example.com/events/summer-opening",
      image: { url: "https://example.com/image.jpg" },
      performer: [{ name: "Artist A" }],
      organizer: { name: "Org A" },
      location: { "@type": "Place", name: "Main Hall" },
    },
    "https://example.com",
  );

  assert.ok(mapped);
  assert.equal(mapped?.title, "Summer Opening");
  assert.equal(mapped?.sourceUrl, "https://example.com/events/summer-opening");
  assert.equal(mapped?.imageUrl, "https://example.com/image.jpg");
  assert.deepEqual(mapped?.artistNames, ["Artist A", "Org A"]);
  assert.equal(mapped?.locationText, "Main Hall");
});

test("mapJsonLdEventToNormalized returns null when name missing", () => {
  const mapped = mapJsonLdEventToNormalized({ "@type": "Event", startDate: "2026-01-01T10:00:00Z" }, "https://example.com");
  assert.equal(mapped, null);
});

test("mapJsonLdEventToNormalized returns null when startDate missing", () => {
  const mapped = mapJsonLdEventToNormalized({ "@type": "Event", name: "No start" }, "https://example.com");
  assert.equal(mapped, null);
});

test("mapJsonLdEventToNormalized sets null startAt when invalid", () => {
  const mapped = mapJsonLdEventToNormalized({ "@type": "Event", name: "Bad start", startDate: "not-a-date" }, "https://example.com");
  assert.equal(mapped?.startAt, null);
});

test("mapJsonLdEventToNormalized nulls endAt when before startAt", () => {
  const mapped = mapJsonLdEventToNormalized(
    { "@type": "Event", name: "Bad end", startDate: "2026-01-02T10:00:00Z", endDate: "2026-01-01T10:00:00Z" },
    "https://example.com",
  );
  assert.equal(mapped?.endAt, null);
});

test("mapJsonLdEventToNormalized picks first string image from array", () => {
  const mapped = mapJsonLdEventToNormalized(
    { "@type": "Event", name: "Image event", startDate: "2026-01-01T10:00:00Z", image: [null, { url: "https://example.com/first.jpg" }, "https://example.com/second.jpg"] },
    "https://example.com",
  );
  assert.equal(mapped?.imageUrl, "https://example.com/first.jpg");
});

test("mapJsonLdEventToNormalized extracts performer object name", () => {
  const mapped = mapJsonLdEventToNormalized(
    { "@type": "Event", name: "Performer", startDate: "2026-01-01T10:00:00Z", performer: { name: "Solo Artist" } },
    "https://example.com",
  );
  assert.deepEqual(mapped?.artistNames, ["Solo Artist"]);
});

test("mapJsonLdEventToNormalized extracts performer array names", () => {
  const mapped = mapJsonLdEventToNormalized(
    { "@type": "Event", name: "Performers", startDate: "2026-01-01T10:00:00Z", performer: [{ name: "A" }, { name: "B" }] },
    "https://example.com",
  );
  assert.deepEqual(mapped?.artistNames, ["A", "B"]);
});

test("mapJsonLdEventToNormalized maps location name", () => {
  const mapped = mapJsonLdEventToNormalized(
    { "@type": "Event", name: "Location", startDate: "2026-01-01T10:00:00Z", location: { "@type": "Place", name: "Gallery 2" } },
    "https://example.com",
  );
  assert.equal(mapped?.locationText, "Gallery 2");
});

test("extractJsonLdEvents reports attempted false with no blocks", () => {
  const result = extractJsonLdEvents("<html><body>none</body></html>", "https://example.com");
  assert.deepEqual(result, { events: [], attempted: false });
});

test("extractJsonLdEvents reports attempted true with no event objects", () => {
  const html = '<script type="application/ld+json">{"@type":"Organization","name":"Org"}</script>';
  const result = extractJsonLdEvents(html, "https://example.com");
  assert.deepEqual(result, { events: [], attempted: true });
});

test("extractJsonLdEvents returns mapped event", () => {
  const html = '<script type="application/ld+json">{"@type":"Event","name":"E","startDate":"2026-01-01T10:00:00Z"}</script>';
  const result = extractJsonLdEvents(html, "https://example.com");
  assert.equal(result.attempted, true);
  assert.equal(result.events.length, 1);
  assert.equal(result.events[0]?.title, "E");
});

test("extractJsonLdEvents unwraps @graph with two events", () => {
  const html = `<script type="application/ld+json">${JSON.stringify({
    "@graph": [
      { "@type": "Event", name: "A", startDate: "2026-01-01T10:00:00Z" },
      { "@type": "ExhibitionEvent", name: "B", startDate: "2026-01-02T10:00:00Z" },
    ],
  })}</script>`;
  const result = extractJsonLdEvents(html, "https://example.com");
  assert.equal(result.events.length, 2);
});

test("extractJsonLdEvents includes past-dated events", () => {
  const html = '<script type="application/ld+json">{"@type":"Event","name":"Past","startDate":"2020-01-01T10:00:00Z"}</script>';
  const result = extractJsonLdEvents(html, "https://example.com");
  assert.equal(result.events.length, 1);
  assert.equal(result.events[0]?.title, "Past");
});

test("extractJsonLdEvents filters mixed @graph to events only", () => {
  const html = `<script type="application/ld+json">${JSON.stringify({
    "@graph": [
      { "@type": "Event", name: "Event A", startDate: "2026-01-01T10:00:00Z" },
      { "@type": "Organization", name: "Org" },
    ],
  })}</script>`;
  const result = extractJsonLdEvents(html, "https://example.com");
  assert.equal(result.events.length, 1);
  assert.equal(result.events[0]?.title, "Event A");
});
