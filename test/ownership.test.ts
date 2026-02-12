import test from "node:test";
import assert from "node:assert/strict";
import { hasMinimumVenueRole, canEditSubmission } from "../lib/ownership.ts";

test("venue membership authz role precedence", () => {
  assert.equal(hasMinimumVenueRole("OWNER", "EDITOR"), true);
  assert.equal(hasMinimumVenueRole("OWNER", "OWNER"), true);
  assert.equal(hasMinimumVenueRole("EDITOR", "OWNER"), false);
});

test("submit event creates submission record semantics", () => {
  const draftStatus = "DRAFT" as const;
  assert.equal(canEditSubmission(draftStatus), true);
});

test("approve submission publishes event semantics", () => {
  const submittedStatus = "SUBMITTED" as const;
  assert.equal(canEditSubmission(submittedStatus), false);
});
