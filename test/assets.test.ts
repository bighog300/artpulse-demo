import test from "node:test";
import assert from "node:assert/strict";
import { MAX_IMAGE_UPLOAD_BYTES, resolveImageUrl, uploadImageAsset, validateImageFile } from "../lib/assets.ts";

test("validateImageFile rejects unsupported mime types", () => {
  const file = new File([new Uint8Array([1, 2, 3])], "notes.txt", { type: "text/plain" });
  assert.throws(() => validateImageFile(file), /invalid_mime/);
});

test("validateImageFile rejects oversized files", () => {
  const file = new File([new Uint8Array(MAX_IMAGE_UPLOAD_BYTES + 1)], "large.png", { type: "image/png" });
  assert.throws(() => validateImageFile(file), /file_too_large/);
});

test("uploadImageAsset returns assetId/url and stores metadata", async () => {
  const file = new File([new Uint8Array([255, 216, 255])], "photo.jpg", { type: "image/jpeg" });

  const createdRows: Array<Record<string, unknown>> = [];
  const result = await uploadImageAsset({
    file,
    ownerUserId: "user-123",
    uploadToBlob: async () => ({ url: "https://blob.example/photo.jpg" }) as { url: string },
    dbClient: {
      asset: {
        create: async ({ data }: { data: Record<string, unknown> }) => {
          createdRows.push(data);
          return { id: "asset-1", url: data.url };
        },
      },
    } as never,
  });

  assert.deepEqual(result, { assetId: "asset-1", url: "https://blob.example/photo.jpg" });
  assert.equal(createdRows.length, 1);
  assert.equal(createdRows[0].ownerUserId, "user-123");
  assert.equal(createdRows[0].mime, "image/jpeg");
});

test("resolveImageUrl prefers asset URL over legacy URL", () => {
  assert.equal(resolveImageUrl("https://blob.example/a.jpg", "https://legacy.example/a.jpg"), "https://blob.example/a.jpg");
  assert.equal(resolveImageUrl(null, "https://legacy.example/a.jpg"), "https://legacy.example/a.jpg");
});
