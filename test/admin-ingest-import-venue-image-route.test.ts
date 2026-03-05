import test from "node:test";
import assert from "node:assert/strict";
import { handleIngestImportVenueImage } from "../lib/admin-ingest-import-venue-image-route";

test("happy path imports venue image without setting featured", async () => {
  let capturedMakePrimary: boolean | undefined;

  const req = new Request("http://localhost/api/admin/ingest/runs/11111111-1111-4111-8111-111111111111/import-venue-image", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ imageUrl: "https://example.com/pic.jpg" }),
  });

  const res = await handleIngestImportVenueImage(
    req,
    { runId: "11111111-1111-4111-8111-111111111111" },
    "admin@example.com",
    {
      appDb: {
        ingestRun: {
          findUnique: async () => ({ venueId: "22222222-2222-4222-8222-222222222222", venue: { websiteUrl: "https://venue.example" } }),
        },
      } as never,
      fetchImage: async () => ({
        bytes: new Uint8Array([1, 2, 3]),
        contentType: "image/jpeg",
        finalUrl: "https://example.com/pic.jpg",
        sizeBytes: 3,
      }),
      uploadVenueImage: async () => ({
        url: "https://blob.example.com/image.jpg",
        path: "venues/ingest/222/image.jpg",
      }),
      addImage: async (input) => {
        capturedMakePrimary = input.makePrimary;
        return Response.json({ item: { id: "img-1", url: input.url, isPrimary: false } }, { status: 201 });
      },
    },
  );

  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.ok, true);
  assert.equal(body.imageId, "img-1");
  assert.equal(body.url, "https://blob.example.com/image.jpg");
  assert.equal(body.isPrimary, false);
  assert.equal(capturedMakePrimary, false);
});

test("happy path sets makePrimary when requested", async () => {
  let capturedMakePrimary: boolean | undefined;

  const req = new Request("http://localhost/api/admin/ingest/runs/11111111-1111-4111-8111-111111111111/import-venue-image", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ imageUrl: "https://example.com/pic.jpg", setAsFeatured: true }),
  });

  const res = await handleIngestImportVenueImage(
    req,
    { runId: "11111111-1111-4111-8111-111111111111" },
    "admin@example.com",
    {
      appDb: {
        ingestRun: {
          findUnique: async () => ({ venueId: "22222222-2222-4222-8222-222222222222", venue: { websiteUrl: "https://venue.example" } }),
        },
      } as never,
      fetchImage: async () => ({
        bytes: new Uint8Array([1, 2, 3]),
        contentType: "image/jpeg",
        finalUrl: "https://example.com/pic.jpg",
        sizeBytes: 3,
      }),
      uploadVenueImage: async () => ({
        url: "https://blob.example.com/image.jpg",
        path: "venues/ingest/222/image.jpg",
      }),
      addImage: async (input) => {
        capturedMakePrimary = input.makePrimary;
        return Response.json({ item: { id: "img-2", url: input.url, isPrimary: true } }, { status: 201 });
      },
    },
  );

  assert.equal(res.status, 200);
  assert.equal(capturedMakePrimary, true);
});

test("returns 404 when run not found", async () => {
  const req = new Request("http://localhost/api/admin/ingest/runs/11111111-1111-4111-8111-111111111111/import-venue-image", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ imageUrl: "https://example.com/pic.jpg" }),
  });

  const res = await handleIngestImportVenueImage(req, { runId: "11111111-1111-4111-8111-111111111111" }, "admin@example.com", {
    appDb: {
      ingestRun: { findUnique: async () => null },
    } as never,
  });

  assert.equal(res.status, 404);
  const body = await res.json();
  assert.equal(body.error.code, "not_found");
});

test("returns 400 when image URL fails safety guard", async () => {
  const req = new Request("http://localhost/api/admin/ingest/runs/11111111-1111-4111-8111-111111111111/import-venue-image", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ imageUrl: "http://127.0.0.1/private.jpg" }),
  });

  const res = await handleIngestImportVenueImage(req, { runId: "11111111-1111-4111-8111-111111111111" }, "admin@example.com", {
    appDb: {
      ingestRun: {
        findUnique: async () => ({ venueId: "22222222-2222-4222-8222-222222222222", venue: { websiteUrl: "https://venue.example" } }),
      },
    } as never,
  });

  assert.equal(res.status, 400);
  const body = await res.json();
  assert.equal(body.error.code, "invalid_image_url");
});

test("returns 400 when image fetch fails", async () => {
  const req = new Request("http://localhost/api/admin/ingest/runs/11111111-1111-4111-8111-111111111111/import-venue-image", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ imageUrl: "https://example.com/pic.jpg" }),
  });

  const res = await handleIngestImportVenueImage(req, { runId: "11111111-1111-4111-8111-111111111111" }, "admin@example.com", {
    appDb: {
      ingestRun: {
        findUnique: async () => ({ venueId: "22222222-2222-4222-8222-222222222222", venue: { websiteUrl: "https://venue.example" } }),
      },
    } as never,
    fetchImage: async () => {
      throw new Error("network down");
    },
  });

  assert.equal(res.status, 400);
  const body = await res.json();
  assert.equal(body.error.code, "image_fetch_failed");
  assert.equal(body.error.message, "network down");
});
