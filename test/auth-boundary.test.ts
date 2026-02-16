import test from "node:test";
import assert from "node:assert/strict";
import { hasGlobalVenueAccess } from "../lib/auth.ts";

test("global EDITOR bypass for venue role is intentionally enabled", () => {
  assert.equal(hasGlobalVenueAccess("EDITOR"), true);
  assert.equal(hasGlobalVenueAccess("ADMIN"), true);
  assert.equal(hasGlobalVenueAccess("USER"), false);
});
