import React from "react";
import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { ArtworkCountBadge } from "@/components/artwork/artwork-count-badge";

test("ArtworkCountBadge renders when count is above zero", () => {
  const html = renderToStaticMarkup(<ArtworkCountBadge count={3} href="/artwork?artistId=abc" />);
  assert.match(html, /3 Artworks/);
  assert.match(html, /\/artwork\?artistId=abc/);
});

test("ArtworkCountBadge hides when count is zero", () => {
  const html = renderToStaticMarkup(<ArtworkCountBadge count={0} href="/artwork?artistId=abc" />);
  assert.equal(html, "");
});

test("my artwork page empty state includes add artwork CTA", () => {
  const file = readFileSync("components/artwork/my-artwork-empty-state.tsx", "utf8");
  assert.match(file, /You haven’t added any artwork yet\./);
  assert.match(file, /Add artwork/);
  assert.match(file, /\/my\/artwork\/new/);
});
