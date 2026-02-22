import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("artwork detail page renders stable detail signals", () => {
  const file = readFileSync("app/artwork/[key]/page.tsx", "utf8");

  // page loads and fetches artwork by route key
  assert.match(file, /export default async function ArtworkDetailPage/);
  assert.match(file, /db\.artwork\.findFirst\(/);

  // routing should support ID lookup and slug redirect
  assert.match(file, /isArtworkIdKey\(key\)/);
  assert.match(file, /shouldRedirectArtworkIdKey\(key, artwork\.slug\)/);
  assert.match(file, /permanentRedirect\(`\/artwork\/\$\{artwork\.slug\}`\)/);

  // heading should be tied to dynamic artwork title, not brittle copy
  assert.match(file, /<h1[^>]*>\{artwork\.title\}<\/h1>/);

  // stable detail fields
  assert.match(file, /href=\{`\/artists\/\$\{artwork\.artist\.slug\}`\}/);
  assert.match(file, /artwork\.images\.map\(\(image\)/);
});
