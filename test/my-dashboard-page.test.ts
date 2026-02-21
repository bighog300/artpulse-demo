import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("/my dashboard page includes key sections and actions", () => {
  const source = readFileSync("app/my/page.tsx", "utf8");
  assert.match(source, /Publisher Dashboard/);
  assert.match(source, /\+ Add artwork/);
  assert.match(source, /\+ Create event/);
  assert.match(source, /View analytics/);
});
