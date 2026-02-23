import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("/my/settings page exists with auth guard and settings content", () => {
  const source = readFileSync("app/my/settings/page.tsx", "utf8");
  assert.match(source, /getSessionUser/);
  assert.match(source, /redirectToLogin\("\/my\/settings"\)/);
  assert.match(source, />Settings</);
  assert.match(source, /Publisher preferences and notification settings\./);
});

test("/my sub-nav links to /my/settings", () => {
  const source = readFileSync("app/my/_components/my-sub-nav.tsx", "utf8");
  assert.match(source, /\["Settings", "\/my\/settings"\]/);
});
