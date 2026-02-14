import test from "node:test";
import assert from "node:assert/strict";
import { savedSearchFrequencySchema, savedSearchRenameSchema } from "../lib/validators.ts";
import { assertOwnedSavedSearch } from "../lib/saved-searches-management.ts";

test("saved search ownership returns false for other user", async () => {
  const owned = await assertOwnedSavedSearch(async () => null, "id-1", "user-1");
  assert.equal(owned, false);
});

test("saved search validation catches invalid payloads", () => {
  assert.equal(savedSearchFrequencySchema.safeParse({ frequency: "DAILY" }).success, false);
  assert.equal(savedSearchRenameSchema.safeParse({ name: "x" }).success, false);
});
