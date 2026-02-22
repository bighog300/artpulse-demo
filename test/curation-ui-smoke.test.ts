import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("admin curation UI renders QA tab", () => {
  const file = readFileSync("app/(admin)/admin/curation/curation-client.tsx", "utf8");
  assert.match(file, /QA/);
  assert.match(file, /Rail health/);
});

test("collection page renders header and sort controls", () => {
  const file = readFileSync("app/collections/[slug]/page.tsx", "utf8");
  assert.match(file, /Curated order/);
  assert.match(file, /Most viewed \(30d\)/);
  assert.match(file, /items/);
});

test("rails keep view collection links", () => {
  const file = readFileSync("components/artwork/curated-collections-rail.tsx", "utf8");
  assert.match(file, /View collection/);
});
