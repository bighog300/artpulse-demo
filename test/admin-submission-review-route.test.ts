import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { handleApproveSubmission, handleRequestChangesSubmission } from "../lib/admin-submission-review-route.ts";

const submissionId = "11111111-1111-4111-8111-111111111111";

const baseSubmission = {
  id: submissionId,
  type: "VENUE" as const,
  kind: "PUBLISH" as const,
  details: null,
  targetEventId: null,
  targetVenueId: "22222222-2222-4222-8222-222222222222",
  status: "SUBMITTED" as const,
  submitter: { id: "user-1", email: "submitter@example.com" },
  targetVenue: { slug: "gallery-aurora" },
};

const baseDeps = {
  publishVenue: async () => undefined,
  setVenueDraft: async () => undefined,
  publishEvent: async () => undefined,
  setEventDraft: async () => undefined,
  findEventUpdatedAt: async () => new Date("2026-01-01T00:00:00.000Z"),
  applyEventRevisionUpdate: async () => undefined,
  markApproved: async () => undefined,
  markNeedsChanges: async () => undefined,
  notifyApproved: async () => undefined,
  notifyNeedsChanges: async () => undefined,
};

test("handleApproveSubmission returns unauthorized for anonymous users", async () => {
  const res = await handleApproveSubmission(Promise.resolve({ id: submissionId }), {
    requireEditor: async () => { throw new Error("unauthorized"); },
    findSubmission: async () => baseSubmission,
    ...baseDeps,
  });
  assert.equal(res.status, 401);
});

test("handleApproveSubmission publishes event for EVENT submissions", async () => {
  let eventPublished = false;
  const res = await handleApproveSubmission(Promise.resolve({ id: submissionId }), {
    requireEditor: async () => ({ id: "editor-1" }),
    findSubmission: async () => ({ ...baseSubmission, type: "EVENT", targetEventId: "33333333-3333-4333-8333-333333333333", targetVenueId: null }),
    ...baseDeps,
    publishEvent: async () => { eventPublished = true; },
  });
  assert.equal(res.status, 200);
  assert.equal(eventPublished, true);
});

test("handleApproveSubmission rejects revision without proposed details", async () => {
  const res = await handleApproveSubmission(Promise.resolve({ id: submissionId }), {
    requireEditor: async () => ({ id: "editor-1" }),
    findSubmission: async () => ({ ...baseSubmission, type: "EVENT", kind: "REVISION", targetEventId: "33333333-3333-4333-8333-333333333333", targetVenueId: null, details: null }),
    ...baseDeps,
  });
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.equal(body.error.code, "invalid_request");
});

test("handleApproveSubmission rejects revision when event has changed", async () => {
  const res = await handleApproveSubmission(Promise.resolve({ id: submissionId }), {
    requireEditor: async () => ({ id: "editor-1" }),
    findSubmission: async () => ({
      ...baseSubmission,
      type: "EVENT",
      kind: "REVISION",
      targetEventId: "33333333-3333-4333-8333-333333333333",
      targetVenueId: null,
      details: { proposed: { title: "Updated" }, baseEventUpdatedAt: "2026-01-01T00:00:00.000Z" },
    }),
    ...baseDeps,
    findEventUpdatedAt: async () => new Date("2026-01-02T00:00:00.000Z"),
  });
  assert.equal(res.status, 400);
});

test("handleApproveSubmission applies revision and marks approved", async () => {
  let applied = false;
  let approved = false;
  const res = await handleApproveSubmission(Promise.resolve({ id: submissionId }), {
    requireEditor: async () => ({ id: "editor-1" }),
    findSubmission: async () => ({
      ...baseSubmission,
      type: "EVENT",
      kind: "REVISION",
      targetEventId: "33333333-3333-4333-8333-333333333333",
      targetVenueId: null,
      details: { proposed: { title: "Updated" }, baseEventUpdatedAt: "2026-01-01T00:00:00.000Z" },
    }),
    ...baseDeps,
    applyEventRevisionUpdate: async () => { applied = true; },
    markApproved: async () => { approved = true; },
  });
  assert.equal(res.status, 200);
  assert.equal(applied, true);
  assert.equal(approved, true);
});

test("handleRequestChangesSubmission requires message", async () => {
  const req = new NextRequest("http://localhost/api/admin/submissions/id/request-changes", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ message: "short" }),
  });
  const res = await handleRequestChangesSubmission(req, Promise.resolve({ id: submissionId }), {
    requireEditor: async () => ({ id: "editor-1" }),
    findSubmission: async () => baseSubmission,
    ...baseDeps,
  });
  assert.equal(res.status, 400);
});

test("handleRequestChangesSubmission does not update event for revision", async () => {
  let drafted = false;
  const req = new NextRequest("http://localhost/api/admin/submissions/id/request-changes", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ message: "Please adjust the title and description details." }),
  });
  const res = await handleRequestChangesSubmission(req, Promise.resolve({ id: submissionId }), {
    requireEditor: async () => ({ id: "editor-1" }),
    findSubmission: async () => ({ ...baseSubmission, type: "EVENT", kind: "REVISION", targetEventId: "33333333-3333-4333-8333-333333333333", targetVenueId: null }),
    ...baseDeps,
    setEventDraft: async () => { drafted = true; },
  });
  assert.equal(res.status, 200);
  assert.equal(drafted, false);
});
