import test from "node:test";
import assert from "node:assert/strict";
import { listFeaturedArtworksByArtist } from "@/lib/artworks";

test("listFeaturedArtworksByArtist maps cover and preserves order", async () => {
  const results = await listFeaturedArtworksByArtist("artist-1", 6, {
    findMany: async () => [
      {
        artwork: {
          id: "a-1",
          slug: "one",
          title: "One",
          artist: { id: "artist-1", name: "Artist" },
          featuredAsset: null,
          images: [{ asset: { url: "https://img/one.jpg" } }],
        },
      },
      {
        artwork: {
          id: "a-2",
          slug: "two",
          title: "Two",
          artist: { id: "artist-1", name: "Artist" },
          featuredAsset: { url: "https://img/two.jpg" },
          images: [],
        },
      },
    ],
  });

  assert.deepEqual(results.map((item) => item.id), ["a-1", "a-2"]);
  assert.equal(results[0].coverUrl, "https://img/one.jpg");
  assert.equal(results[1].coverUrl, "https://img/two.jpg");
});
