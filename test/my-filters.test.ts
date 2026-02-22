import test from "node:test";
import assert from "node:assert/strict";
import { parseArtworkFilter, parseEventFilter, parseVenueFilter } from "@/lib/my-filters";

test("parseArtworkFilter supports missingCover and draft", () => {
  assert.equal(parseArtworkFilter("missingCover"), "missingCover");
  assert.equal(parseArtworkFilter("draft"), "draft");
  assert.equal(parseArtworkFilter("other"), undefined);
});

test("parseVenueFilter supports missingCover, needsEdits, submitted", () => {
  assert.equal(parseVenueFilter("missingCover"), "missingCover");
  assert.equal(parseVenueFilter("needsEdits"), "needsEdits");
  assert.equal(parseVenueFilter("submitted"), "submitted");
  assert.equal(parseVenueFilter("other"), undefined);
});

test("parseEventFilter supports missingVenue and draft", () => {
  assert.equal(parseEventFilter("missingVenue"), "missingVenue");
  assert.equal(parseEventFilter("draft"), "draft");
  assert.equal(parseEventFilter("other"), undefined);
});
