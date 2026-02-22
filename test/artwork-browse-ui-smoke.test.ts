import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("artwork browse UI includes sort + filters + save search controls", () => {
  const file = readFileSync("app/artwork/artwork-browser.tsx", "utf8");
  assert.match(file, /Most viewed \(30d\)/);
  assert.match(file, /Has images/);
  assert.match(file, /Has price/);
  assert.match(file, /Save search/);
});
