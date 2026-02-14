import assert from "node:assert/strict";
import test from "node:test";
import { dedupeAssociatedArtists, type AssociatedArtistInput } from "@/lib/venue-associated-artists";

function makeArtist(artistId: string, name = artistId): AssociatedArtistInput {
  return {
    artistId,
    artist: {
      id: artistId,
      name,
      slug: `${artistId}-slug`,
      featuredImageUrl: `https://example.com/${artistId}.jpg`,
    },
  };
}

test("dedupeAssociatedArtists removes duplicates while preserving order", () => {
  const result = dedupeAssociatedArtists(
    [makeArtist("a1"), makeArtist("a1"), makeArtist("a2")],
    [makeArtist("a3"), makeArtist("a3")],
  );

  assert.deepEqual(result.verifiedArtists.map((artist) => artist.id), ["a1", "a2"]);
  assert.deepEqual(result.derivedArtists.map((artist) => artist.id), ["a3"]);
});

test("dedupeAssociatedArtists gives verified precedence over derived", () => {
  const result = dedupeAssociatedArtists(
    [makeArtist("a1"), makeArtist("a2")],
    [makeArtist("a2"), makeArtist("a3")],
  );

  assert.deepEqual(result.verifiedArtists.map((artist) => artist.id), ["a1", "a2"]);
  assert.deepEqual(result.derivedArtists.map((artist) => artist.id), ["a3"]);
});

test("dedupeAssociatedArtists resolves coverUrl on returned summaries", () => {
  const result = dedupeAssociatedArtists([makeArtist("a1")], []);

  assert.equal(result.verifiedArtists[0]?.coverUrl, "https://example.com/a1.jpg");
});
