import test from "node:test";
import assert from "node:assert/strict";
import { isVercelBlobUrl } from "../lib/blob-delete";

test("isVercelBlobUrl matches only https vercel blob hosts", () => {
  assert.equal(isVercelBlobUrl("https://abc.public.blob.vercel-storage.com/image.jpg"), true);
  assert.equal(isVercelBlobUrl("https://blob.vercel-storage.com/image.jpg"), false);
  assert.equal(isVercelBlobUrl("http://abc.public.blob.vercel-storage.com/image.jpg"), false);
  assert.equal(isVercelBlobUrl("https://example.com/image.jpg"), false);
  assert.equal(isVercelBlobUrl("not-a-url"), false);
});
