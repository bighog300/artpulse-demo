import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { handleApproveSubmission, handleRequestChangesSubmission } from "../lib/admin-submission-review-route.ts";

const submissionId = "11111111-1111-4111-8111-111111111111";

const baseSubmission = {
  id: submissionId,
  type: "VENUE" as const,
  targetVenueId: "22222222-2222-4222-8222-222222222222",
  status: "SUBMITTED" as const,
  submitter: { id: "user-1", email: "submitter@example.com" },
  targetVenue: { slug: "gallery-aurora" },
};

test("handleApproveSubmission returns unauthorized for anonymous users", async () => {
  const res = await handleApproveSubmission(Promise.resolve({ id: submissionId }), {
    requireEditor: async () => { throw new Error("unauthorized"); },
    findSubmission: async () => baseSubmission,
    publishVenue: async () => undefined,
    setVenueDraft: async () => undefined,
    markApproved: async () => undefined,
    markNeedsChanges: async () => undefined,
    notifyApproved: async () => undefined,
    notifyNeedsChanges: async () => undefined,
  });

  assert.equal(res.status, 401);
  const body = await res.json();
  assert.equal(body.error.code, "unauthorized");
});

test("handleApproveSubmission returns forbidden for non-editors", async () => {
  const res = await handleApproveSubmission(Promise.resolve({ id: submissionId }), {
    requireEditor: async () => { throw new Error("forbidden"); },
    findSubmission: async () => baseSubmission,
    publishVenue: async () => undefined,
    setVenueDraft: async () => undefined,
    markApproved: async () => undefined,
    markNeedsChanges: async () => undefined,
    notifyApproved: async () => undefined,
    notifyNeedsChanges: async () => undefined,
  });

  assert.equal(res.status, 403);
  const body = await res.json();
  assert.equal(body.error.code, "forbidden");
});

test("handleApproveSubmission returns invalid_request for wrong submission type", async () => {
  const res = await handleApproveSubmission(Promise.resolve({ id: submissionId }), {
    requireEditor: async () => ({ id: "editor-1" }),
    findSubmission: async () => ({ ...baseSubmission, type: "EVENT" }),
    publishVenue: async () => undefined,
    setVenueDraft: async () => undefined,
    markApproved: async () => undefined,
    markNeedsChanges: async () => undefined,
    notifyApproved: async () => undefined,
    notifyNeedsChanges: async () => undefined,
  });

  assert.equal(res.status, 400);
  const body = await res.json();
  assert.equal(body.error.code, "invalid_request");
});

test("handleApproveSubmission publishes venue and marks submission approved", async () => {
  let published = false;
  let updated = false;
  const res = await handleApproveSubmission(Promise.resolve({ id: submissionId }), {
    requireEditor: async () => ({ id: "editor-1" }),
    findSubmission: async () => baseSubmission,
    publishVenue: async () => { published = true; },
    setVenueDraft: async () => undefined,
    markApproved: async () => { updated = true; },
    markNeedsChanges: async () => undefined,
    notifyApproved: async () => undefined,
    notifyNeedsChanges: async () => undefined,
  });

  assert.equal(res.status, 200);
  assert.equal(published, true);
  assert.equal(updated, true);
  const body = await res.json();
  assert.equal(body.ok, true);
});

test("handleRequestChangesSubmission updates submission status and keeps venue draft", async () => {
  let drafted = false;
  let changed = false;
  const req = new NextRequest("http://localhost/api/admin/submissions/id/request-changes", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ message: "Please add a fuller description and a cover image." }),
  });

  const res = await handleRequestChangesSubmission(req, Promise.resolve({ id: submissionId }), {
    requireEditor: async () => ({ id: "editor-1" }),
    findSubmission: async () => baseSubmission,
    publishVenue: async () => undefined,
    setVenueDraft: async () => { drafted = true; },
    markApproved: async () => undefined,
    markNeedsChanges: async () => { changed = true; },
    notifyApproved: async () => undefined,
    notifyNeedsChanges: async () => undefined,
  });

  assert.equal(res.status, 200);
  assert.equal(drafted, true);
  assert.equal(changed, true);
});
