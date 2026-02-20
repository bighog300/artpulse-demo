import test from "node:test";
import assert from "node:assert/strict";
import { handleAdminBlobUpload } from "../lib/admin-blob-upload-route";

test("admin blob upload token generation requires admin", async () => {
  await assert.rejects(
    () => handleAdminBlobUpload(new Request("http://localhost/api/admin/blob/upload"), {
      type: "blob.generate-client-token",
      payload: {
        pathname: "events/new-image.jpg",
        callbackUrl: "http://localhost/api/admin/blob/upload",
        clientPayload: JSON.stringify({ targetType: "event", targetId: "new", role: "featured" }),
        multipart: false,
      },
    } as never, {
      requireAdminUser: async () => {
        throw new Error("forbidden");
      },
      handleUploadFn: async ({ onBeforeGenerateToken }) => {
        await onBeforeGenerateToken("events/new-image.jpg", JSON.stringify({ targetType: "event", targetId: "new", role: "featured" }), false);
        return { type: "blob.generate-client-token", clientToken: "token" };
      },
    }),
    /forbidden/,
  );
});

test("admin blob upload token generation includes image constraints", async () => {
  let options: any = null;

  const response = await handleAdminBlobUpload(new Request("http://localhost/api/admin/blob/upload"), {
    type: "blob.generate-client-token",
    payload: {
      pathname: "events/new-image.jpg",
      callbackUrl: "http://localhost/api/admin/blob/upload",
      clientPayload: JSON.stringify({ targetType: "event", targetId: "evt_1", role: "gallery" }),
      multipart: false,
    },
  } as never, {
    requireAdminUser: async () => ({ id: "00000000-0000-0000-0000-000000000123", email: "admin@example.com" }),
    handleUploadFn: async ({ onBeforeGenerateToken }) => {
      options = await onBeforeGenerateToken("events/new-image.jpg", JSON.stringify({ targetType: "event", targetId: "evt_1", role: "gallery" }), false);
      return { type: "blob.generate-client-token", clientToken: "token" };
    },
  });

  assert.equal(response.type, "blob.generate-client-token");
  assert.deepEqual(options?.allowedContentTypes, ["image/jpeg", "image/png", "image/webp"]);
  assert.equal(options?.addRandomSuffix, true);
  assert.match(options?.tokenPayload ?? "", /admin@example.com/);
  assert.match(options?.tokenPayload ?? "", /evt_1/);
});
