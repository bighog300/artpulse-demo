import React from "react";
import test from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { TrendingRail } from "../components/artwork/trending-rail";

test("TrendingRail renders section title, views labels, and artwork links", () => {
  const html = renderToStaticMarkup(
    <TrendingRail
      items={[
        { id: "a1", slug: "sunset", title: "Sunset", coverUrl: null, artist: { name: "Ada", slug: "ada" }, views30: 123 },
        { id: "a2", slug: null, title: "Untitled", coverUrl: null, artist: { name: "Bea", slug: "bea" }, views30: 77 },
      ]}
    />,
  );

  assert.match(html, /Trending \(30 days\)/);
  assert.match(html, /Most viewed artworks in the last month/);
  assert.match(html, /href="\/artwork\?sort=VIEWS_30D_DESC"/);
  assert.match(html, /123 views \(30d\)/);
  assert.match(html, /77 views \(30d\)/);
  assert.match(html, /href="\/artwork\/sunset"/);
  assert.match(html, /href="\/artwork\/a2"/);
});
