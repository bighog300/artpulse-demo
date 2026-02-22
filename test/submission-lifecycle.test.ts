import test from "node:test";
import assert from "node:assert/strict";
import { getLatestArtistSubmission, getStatusUiLabel } from "../lib/submission-lifecycle.ts";

test("maps UI labels", () => {
  assert.equal(getStatusUiLabel("DRAFT"), "Draft");
  assert.equal(getStatusUiLabel("REJECTED"), "Needs edits");
});

test("getLatestArtistSubmission maps moderation fields", async () => {
  const latest = await getLatestArtistSubmission({
    submission: {
      findFirst: async () => ({ id: "sub-1", status: "REJECTED", submittedAt: new Date("2026-01-01"), decidedAt: new Date("2026-01-02"), decisionReason: "Fix bio" }),
    },
  } as never, "artist-1");
  assert.equal(latest?.submissionId, "sub-1");
  assert.equal(latest?.rejectionReason, "Fix bio");
  assert.equal(latest?.reviewedAt?.toISOString(), "2026-01-02T00:00:00.000Z");
});
