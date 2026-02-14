import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_ASSOCIATION_ROLE, isRoleKey, normalizeAssociationRole, roleLabel } from "@/lib/association-roles";

test("normalizeAssociationRole maps known and synonym values", () => {
  assert.equal(normalizeAssociationRole("represented_by"), "represented_by");
  assert.equal(normalizeAssociationRole("represented"), "represented_by");
  assert.equal(normalizeAssociationRole("exhibition"), "exhibited_at");
  assert.equal(normalizeAssociationRole("resident"), "resident_artist");
});

test("normalizeAssociationRole defaults empty and unknown", () => {
  assert.equal(normalizeAssociationRole(""), DEFAULT_ASSOCIATION_ROLE);
  assert.equal(normalizeAssociationRole(undefined), DEFAULT_ASSOCIATION_ROLE);
  assert.equal(normalizeAssociationRole("legacy_role"), "other");
});

test("roleLabel and isRoleKey are stable", () => {
  assert.equal(roleLabel("collaborator"), "Collaborator");
  assert.equal(roleLabel("resident_artist"), "Resident artist");
  assert.equal(isRoleKey("exhibited_at"), true);
  assert.equal(isRoleKey("resident"), false);
});
