import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("venue setup page renders publish panel CTA instead of header CTA", () => {
  const page = readFileSync("app/my/venues/[id]/page.tsx", "utf8");
  const panel = readFileSync("app/my/_components/VenuePublishPanel.tsx", "utf8");

  assert.match(page, /<VenuePublishPanel/);
  assert.doesNotMatch(page, /actions=\{\([\s\S]*VenueSubmitButton/);
  assert.match(panel, /<VenueSubmitButton/);
  assert.match(panel, /Publish venue/);
});
