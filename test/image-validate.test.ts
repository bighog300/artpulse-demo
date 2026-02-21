import test from "node:test";
import assert from "node:assert/strict";
import { IMAGE_UPLOAD_MAX_BYTES, validateImageFile } from "../lib/image-validate";

test("validateImageFile rejects unsupported mime type", async () => {
  const file = new File([new Uint8Array([1, 2, 3])], "bad.gif", { type: "image/gif" });
  const result = await validateImageFile(file);
  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.reason, /JPEG, PNG, and WEBP/);
});

test("validateImageFile rejects oversized files", async () => {
  const file = new File([new Uint8Array(IMAGE_UPLOAD_MAX_BYTES + 1)], "large.jpg", { type: "image/jpeg" });
  const result = await validateImageFile(file);
  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.reason, /exceeds/);
});

test("validateImageFile enforces dimension bounds", async () => {
  const original = globalThis.createImageBitmap;
  globalThis.createImageBitmap = async () => ({ width: 120, height: 150, close: () => undefined } as ImageBitmap);

  try {
    const file = new File([new Uint8Array([1])], "small.webp", { type: "image/webp" });
    const result = await validateImageFile(file);
    assert.equal(result.ok, false);
    if (!result.ok) assert.match(result.reason, /at least 200px/);
  } finally {
    globalThis.createImageBitmap = original;
  }
});

test("validateImageFile passes valid image metadata", async () => {
  const original = globalThis.createImageBitmap;
  globalThis.createImageBitmap = async () => ({ width: 1200, height: 900, close: () => undefined } as ImageBitmap);

  try {
    const file = new File([new Uint8Array([1])], "ok.png", { type: "image/png" });
    const result = await validateImageFile(file);
    assert.deepEqual(result, { ok: true });
  } finally {
    globalThis.createImageBitmap = original;
  }
});
