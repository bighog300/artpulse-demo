import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { handleAdminCurationPreview, handleAdminCurationQa } from "../lib/admin-curation-route.ts";
import { handlePublicCollectionBySlug } from "../lib/public-collections-route.ts";

test("/api/admin/curation/qa rejects non-admin users", async () => {
  const res = await handleAdminCurationQa(new NextRequest("http://localhost/api/admin/curation/qa"), {
    requireAdminUser: async () => { throw new Error("forbidden"); },
    getQaSummary: async () => ({ totals: { collections: 0, publishedCollections: 0, items: 0 }, byCollection: [], duplicates: [] }),
    getPreview: async () => null,
  });
  assert.equal(res.status, 403);
});

test("/api/admin/curation/collections/[id]/preview rejects non-admin users", async () => {
  const res = await handleAdminCurationPreview(new NextRequest("http://localhost/api/admin/curation/collections/1/preview"), { id: "00000000-0000-4000-8000-000000000001" }, {
    requireAdminUser: async () => { throw new Error("forbidden"); },
    getQaSummary: async () => ({ totals: { collections: 0, publishedCollections: 0, items: 0 }, byCollection: [], duplicates: [] }),
    getPreview: async () => null,
  });
  assert.equal(res.status, 403);
});

test("/api/admin/curation/qa groups duplicates and counts issues", async () => {
  const res = await handleAdminCurationQa(new NextRequest("http://localhost/api/admin/curation/qa"), {
    requireAdminUser: async () => ({ id: "admin" }),
    getQaSummary: async () => ({
      totals: { collections: 2, publishedCollections: 2, items: 3 },
      byCollection: [{ id: "c1", title: "A", slug: "a", isPublished: true, counts: { totalItems: 2, unpublishedArtworks: 1, missingCover: 1, publishBlocked: 1, duplicatesInOtherCollections: 1 }, flags: ["HAS_DUPES"] }],
      duplicates: [{ artworkId: "a1", title: "Dup", slug: "dup", collections: [{ id: "c1", title: "A", slug: "a", isPublished: true }, { id: "c2", title: "B", slug: "b", isPublished: true }] }],
    }),
    getPreview: async () => null,
  });
  const body = await res.json();
  assert.equal(body.duplicates.length, 1);
  assert.equal(body.duplicates[0].collections.length, 2);
  assert.equal(body.byCollection[0].counts.missingCover, 1);
  assert.equal(body.byCollection[0].counts.publishBlocked, 1);
});

test("/api/collections/[slug] returns 404 when collection is not public", async () => {
  const res = await handlePublicCollectionBySlug(new NextRequest("http://localhost/api/collections/hidden"), { slug: "hidden" }, {
    getCollection: async () => null,
  });
  assert.equal(res.status, 404);
});

test("/api/collections/[slug] preserves curated order and supports VIEWS_30D_DESC", async () => {
  const deps = {
    getCollection: async (_slug: string, input?: { sort?: string }) => ({
      id: "c1",
      slug: "featured",
      title: "Featured",
      description: null,
      itemCount: 2,
      artworks: input?.sort === "VIEWS_30D_DESC"
        ? [{ id: "a2", slug: "a2", title: "A2", artist: { id: "ar", name: "Artist", slug: "artist" }, coverUrl: null }, { id: "a1", slug: "a1", title: "A1", artist: { id: "ar", name: "Artist", slug: "artist" }, coverUrl: null }]
        : [{ id: "a1", slug: "a1", title: "A1", artist: { id: "ar", name: "Artist", slug: "artist" }, coverUrl: null }, { id: "a2", slug: "a2", title: "A2", artist: { id: "ar", name: "Artist", slug: "artist" }, coverUrl: null }],
    }),
  };

  const curated = await handlePublicCollectionBySlug(new NextRequest("http://localhost/api/collections/featured"), { slug: "featured" }, deps as never);
  const curatedBody = await curated.json();
  assert.equal(curated.status, 200);
  assert.deepEqual(curatedBody.collection.artworks.map((item: any) => item.id), ["a1", "a2"]);

  const viewed = await handlePublicCollectionBySlug(new NextRequest("http://localhost/api/collections/featured?sort=VIEWS_30D_DESC"), { slug: "featured" }, deps as never);
  const viewedBody = await viewed.json();
  assert.deepEqual(viewedBody.collection.artworks.map((item: any) => item.id), ["a2", "a1"]);
});


test("/api/admin/curation/collections/[id]/preview includes unpublished artworks with status flags", async () => {
  const res = await handleAdminCurationPreview(new NextRequest("http://localhost/api/admin/curation/collections/1/preview"), { id: "00000000-0000-4000-8000-000000000001" }, {
    requireAdminUser: async () => ({ id: "admin" }),
    getQaSummary: async () => ({ totals: { collections: 0, publishedCollections: 0, items: 0 }, byCollection: [], duplicates: [] }),
    getPreview: async () => ({ collection: { id: "c1", slug: "x", title: "X", description: null, isPublished: false }, items: [{ artworkId: "a1", title: "Draft", slug: null, isPublished: false, coverOk: false, completeness: { requiredOk: false, scorePct: 40 } }] }),
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.items[0].isPublished, false);
  assert.equal(body.items[0].coverOk, false);
});
