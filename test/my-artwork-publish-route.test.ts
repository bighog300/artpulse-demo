import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { handlePatchArtworkPublish } from "@/lib/my-artwork-publish-route";

const req = new NextRequest("http://localhost/api/my/artwork/id/publish", { method: "PATCH" });

test("publishing without title returns 409 and MISSING_TITLE", async () => {
  const response = await handlePatchArtworkPublish(req, { artworkId: "a1", isPublished: true }, {
    requireMyArtworkAccess: async () => ({ user: { email: "artist@example.com" } }),
    findArtworkById: async () => ({ id: "a1", title: "", description: null, year: null, medium: null, featuredAssetId: null, isPublished: false }),
    countArtworkImages: async () => 0,
    findFirstArtworkImageAssetId: async () => null,
    updateArtworkPublishState: async () => { throw new Error("should not publish"); },
    logAdminAction: async () => undefined,
  });

  assert.equal(response.status, 409);
  const body = await response.json();
  assert.equal(body.error, "ARTWORK_NOT_PUBLISHABLE");
  assert.equal(body.requiredIssues.some((issue: { code: string }) => issue.code === "MISSING_TITLE"), true);
});

test("publishing without images returns 409 and MISSING_IMAGE", async () => {
  const response = await handlePatchArtworkPublish(req, { artworkId: "a1", isPublished: true }, {
    requireMyArtworkAccess: async () => ({ user: { email: "artist@example.com" } }),
    findArtworkById: async () => ({ id: "a1", title: "Valid title", description: null, year: null, medium: null, featuredAssetId: null, isPublished: false }),
    countArtworkImages: async () => 0,
    findFirstArtworkImageAssetId: async () => null,
    updateArtworkPublishState: async () => { throw new Error("should not publish"); },
    logAdminAction: async () => undefined,
  });

  assert.equal(response.status, 409);
  const body = await response.json();
  assert.equal(body.requiredIssues.some((issue: { code: string }) => issue.code === "MISSING_IMAGE"), true);
});

test("unpublishing always succeeds", async () => {
  let logged = false;
  const response = await handlePatchArtworkPublish(req, { artworkId: "a1", isPublished: false }, {
    requireMyArtworkAccess: async () => ({ user: { email: "artist@example.com" } }),
    findArtworkById: async () => null,
    countArtworkImages: async () => 0,
    findFirstArtworkImageAssetId: async () => null,
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
    countArtworkImages: async () => 2,
    findFirstArtworkImageAssetId: async () => "asset-1",
    updateArtworkPublishState: async (_id, input) => {
      updatedFeaturedAssetId = input.featuredAssetId;
      return { id: "a1", title: "Valid title", description: null, year: null, medium: null, featuredAssetId: input.featuredAssetId ?? null, isPublished: true };
    },
    logAdminAction: async () => undefined,
  });

  assert.equal(response.status, 200);
  assert.equal(updatedFeaturedAssetId, "asset-1");
});
