import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("admin event detail page includes danger zone with hard delete", () => {
  const source = readFileSync("app/(admin)/admin/events/[id]/page.tsx", "utf8");
  assert.match(source, /Danger zone/);
  assert.match(source, /AdminHardDeleteButton/);
  assert.match(source, /Hard delete permanently removes this event and related data/);
});
