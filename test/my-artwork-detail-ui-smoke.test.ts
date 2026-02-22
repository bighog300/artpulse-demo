import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("my artwork detail page includes publish readiness panel", () => {
  const file = readFileSync("app/my/artwork/[id]/page.tsx", "utf8");
  assert.match(file, /Publish readiness/);
  assert.match(file, /requiredIssues/);
  assert.match(file, /ARTWORK_NOT_PUBLISHABLE/);
});
