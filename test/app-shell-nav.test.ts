import test from "node:test";
import assert from "node:assert/strict";
import { getShellNavMode } from "../components/shell/app-shell-nav";

test("shell nav mode hides global nav on admin routes", () => {
  assert.equal(getShellNavMode("/admin"), "hidden");
  assert.equal(getShellNavMode("/admin/events"), "hidden");
});

test("shell nav mode renders auth nav on login and invite routes", () => {
  assert.equal(getShellNavMode("/login"), "auth");
  assert.equal(getShellNavMode("/invite/token-123"), "auth");
});

test("shell nav mode renders full nav on normal routes including /my", () => {
  assert.equal(getShellNavMode("/"), "full");
  assert.equal(getShellNavMode("/events"), "full");
  assert.equal(getShellNavMode("/my/venues"), "full");
});
