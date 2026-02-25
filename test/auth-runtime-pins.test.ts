import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "..");

function read(file: string) {
  return fs.readFileSync(path.join(repoRoot, file), "utf8");
}

test("auth-gated For You page is pinned to nodejs runtime", () => {
  const source = read("app/for-you/page.tsx");
  assert.match(source, /export const runtime = "nodejs";/);
});

test("root layout is pinned to nodejs because it reads session", () => {
  const source = read("app/layout.tsx");
  assert.match(source, /export const runtime = "nodejs";/);
  assert.match(source, /getSessionUser/);
});
