import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { handleGetMyArtistFeaturedArtworks, handlePutMyArtistFeaturedArtworks } from "@/lib/my-artist-featured-artworks-route";

test("featured artworks requires auth", async () => {
  const req = new NextRequest("http://localhost/api/my/artist/featured-artworks", { method: "GET" });
  const res = await handleGetMyArtistFeaturedArtworks(req, {
    requireAuth: async () => { throw new Error("unauthorized"); },
    findOwnedArtistByUserId: async () => ({ id: "artist-1" }),
    listFeatured: async () => [],
    findPublishedOwnedArtworkIds: async () => [],
    replaceFeatured: async () => undefined,
    logAdminAction: async () => undefined,
  });
  assert.equal(res.status, 401);
});

test("featured artworks ownership enforced", async () => {
  const req = new NextRequest("http://localhost/api/my/artist/featured-artworks", { method: "GET" });
  const res = await handleGetMyArtistFeaturedArtworks(req, {
    requireAuth: async () => ({ id: "user-1", email: "u@example.com" }),
    findOwnedArtistByUserId: async () => null,
    listFeatured: async () => [],
    findPublishedOwnedArtworkIds: async () => [],
    replaceFeatured: async () => undefined,
    logAdminAction: async () => undefined,
  });
  assert.equal(res.status, 403);
});

test("featured artworks max selection enforced", async () => {
  const req = new NextRequest("http://localhost/api/my/artist/featured-artworks", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ artworkIds: Array.from({ length: 7 }).map((_, i) => `11111111-1111-4111-8111-11111111111${i}`) }),
  });
  const res = await handlePutMyArtistFeaturedArtworks(req, {
    requireAuth: async () => ({ id: "user-1", email: "u@example.com" }),
    findOwnedArtistByUserId: async () => ({ id: "artist-1" }),
    listFeatured: async () => [],
    findPublishedOwnedArtworkIds: async () => [],
    replaceFeatured: async () => undefined,
    logAdminAction: async () => undefined,
  });
  assert.equal(res.status, 400);
});

test("featured artworks only allow published owned artworks and preserve order", async () => {
  const ids = ["11111111-1111-4111-8111-111111111111", "22222222-2222-4222-8222-222222222222"];
  let replaced: string[] = [];
  const req = new NextRequest("http://localhost/api/my/artist/featured-artworks", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ artworkIds: ids }),
  });

  const res = await handlePutMyArtistFeaturedArtworks(req, {
    requireAuth: async () => ({ id: "user-1", email: "u@example.com" }),
    findOwnedArtistByUserId: async () => ({ id: "artist-1" }),
    listFeatured: async () => replaced.map((id, index) => ({ sortOrder: index, artwork: { id, slug: null, title: id, featuredAsset: null, images: [] } })),
    findPublishedOwnedArtworkIds: async (_artistId, artworkIds) => artworkIds,
    replaceFeatured: async (_artistId, artworkIds) => { replaced = artworkIds; },
    logAdminAction: async () => undefined,
  });

  assert.equal(res.status, 200);
  const body = await res.json();
  assert.deepEqual(body.artworks.map((item: { id: string }) => item.id), ids);
});

test("featured artworks rejects unpublished ids", async () => {
  const ids = ["11111111-1111-4111-8111-111111111111", "22222222-2222-4222-8222-222222222222"];
  const req = new NextRequest("http://localhost/api/my/artist/featured-artworks", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ artworkIds: ids }),
  });

  const res = await handlePutMyArtistFeaturedArtworks(req, {
    requireAuth: async () => ({ id: "user-1", email: "u@example.com" }),
    findOwnedArtistByUserId: async () => ({ id: "artist-1" }),
    listFeatured: async () => [],
    findPublishedOwnedArtworkIds: async () => [ids[0]],
    replaceFeatured: async () => undefined,
    logAdminAction: async () => undefined,
  });

  assert.equal(res.status, 400);
});
