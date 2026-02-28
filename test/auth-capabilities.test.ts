import test from "node:test";
import assert from "node:assert/strict";
import { canSelfPublish } from "../lib/auth";

test("canSelfPublish returns true for ADMIN", () => {
  assert.equal(canSelfPublish({ role: "ADMIN" }), true);
});

test("canSelfPublish returns false for non-admin roles and nullish users", () => {
  assert.equal(canSelfPublish({ role: "EDITOR" }), false);
  assert.equal(canSelfPublish({ role: "USER" }), false);
  assert.equal(canSelfPublish(null), false);
  assert.equal(canSelfPublish(undefined), false);
});
