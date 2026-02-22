import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { handlePatchArtworkPublish } from "@/lib/my-artwork-publish-route";

const req = new NextRequest("http://localhost/api/my/artwork/id/publish", { method: "PATCH" });

test("publishing without title returns 400 NOT_READY", async () => {
  const response = await handlePatchArtworkPublish(req, { artworkId: "a1", isPublished: true }, {
    requireMyArtworkAccess: async () => ({ user: { email: "artist@example.com" } }),
    findArtworkById: async () => ({ id: "a1", title: "", description: null, year: null, medium: null, featuredAssetId: null, isPublished: false }),
    listArtworkImages: async () => [],
    updateArtworkPublishState: async () => { throw new Error("should not publish"); },
    logAdminAction: async () => undefined,
  });

  assert.equal(response.status, 400);
  const body = await response.json();
  assert.equal(body.error, "NOT_READY");
  assert.equal(body.blocking.some((issue: { id: string }) => issue.id === "artwork-title"), true);
});

test("publishing without images returns 400 NOT_READY and no state change", async () => {
  let updated = false;
  const response = await handlePatchArtworkPublish(req, { artworkId: "a1", isPublished: true }, {
    requireMyArtworkAccess: async () => ({ user: { email: "artist@example.com" } }),
    findArtworkById: async () => ({ id: "a1", title: "Valid title", description: null, year: null, medium: null, featuredAssetId: null, isPublished: false }),
    listArtworkImages: async () => [],
    updateArtworkPublishState: async () => { updated = true; throw new Error("should not publish"); },
    logAdminAction: async () => undefined,
  });

  assert.equal(response.status, 400);
  const body = await response.json();
  assert.equal(body.blocking.some((issue: { id: string }) => issue.id === "artwork-images"), true);
  assert.equal(updated, false);
});

test("unpublishing always succeeds", async () => {
  let logged = false;
  const response = await handlePatchArtworkPublish(req, { artworkId: "a1", isPublished: false }, {
    requireMyArtworkAccess: async () => ({ user: { email: "artist@example.com" } }),
    findArtworkById: async () => null,
    listArtworkImages: async () => [],
    updateArtworkPublishState: async () => ({ id: "a1", title: "x", description: null, year: null, medium: null, featuredAssetId: null, isPublished: false }),
    logAdminAction: async () => { logged = true; },
  });

  assert.equal(response.status, 200);
  assert.equal(logged, true);
});

test("publish auto-assigns cover from first image when missing", async () => {
  let updatedFeaturedAssetId: string | undefined;
  const response = await handlePatchArtworkPublish(req, { artworkId: "a1", isPublished: true }, {
    requireMyArtworkAccess: async () => ({ user: { email: "artist@example.com" } }),
    findArtworkById: async () => ({ id: "a1", title: "Valid title", description: "This description is long enough for recommendation.", year: 2024, medium: "Ink", featuredAssetId: null, isPublished: false }),
    listArtworkImages: async () => [{ id: "img-1", assetId: "asset-1" }, { id: "img-2", assetId: "asset-2" }],
    updateArtworkPublishState: async (_id, input) => {
      updatedFeaturedAssetId = input.featuredAssetId;
      return { id: "a1", title: "Valid title", description: null, year: null, medium: null, featuredAssetId: input.featuredAssetId ?? null, isPublished: true };
    },
    logAdminAction: async () => undefined,
  });

  assert.equal(response.status, 200);
  assert.equal(updatedFeaturedAssetId, "asset-1");
});
