import test from "node:test";
import assert from "node:assert/strict";
import { resolveEntityGallery, resolveEntityPrimaryImage } from "../lib/public-images";

test("resolveEntityPrimaryImage prefers relation primary and returns dimensions", () => {
  const entity = {
    title: "Event",
    featuredImageUrl: "https://example.com/featured.jpg",
    images: [
      { url: "https://example.com/secondary.jpg", alt: "Secondary", sortOrder: 2, isPrimary: false, width: 300, height: 200 },
      { url: "https://example.com/primary.jpg", alt: "Primary", sortOrder: 1, isPrimary: true, width: 1200, height: 800 },
    ],
  };

  const primary = resolveEntityPrimaryImage(entity);
  assert.equal(primary?.url, "https://example.com/primary.jpg");
  assert.equal(primary?.width, 1200);
  assert.equal(primary?.height, 800);
});

test("resolveEntityGallery filters non-https urls", () => {
  const gallery = resolveEntityGallery({ title: "Event", images: [{ url: "http://example.com/plain.jpg" }, { url: "https://example.com/ok.jpg" }] });
  assert.equal(gallery.length, 1);
  assert.equal(gallery[0]?.url, "https://example.com/ok.jpg");
});
