import test from "node:test";
import assert from "node:assert/strict";
import { buildNotification } from "../lib/notification-templates.ts";

test("INVITE_CREATED builds invite href and stable dedupe", () => {
  const one = buildNotification({
    type: "INVITE_CREATED",
    payload: { type: "INVITE_CREATED", inviteId: "inv-1", inviteToken: "tok-1", role: "EDITOR" },
  });
  const two = buildNotification({
    type: "INVITE_CREATED",
    payload: { type: "INVITE_CREATED", inviteId: "inv-1", inviteToken: "tok-1", role: "EDITOR" },
  });

  assert.equal(one.href, "/invite/tok-1");
  assert.equal(one.dedupeKey, two.dedupeKey);
  assert.ok(one.title);
  assert.ok(one.body);
});

test("SUBMISSION_SUBMITTED hrefs are consistent", () => {
  const eventSubmission = buildNotification({
    type: "SUBMISSION_SUBMITTED",
    payload: { type: "SUBMISSION_SUBMITTED", submissionId: "sub-1", submissionType: "EVENT" },
  });
  const venueSubmission = buildNotification({
    type: "SUBMISSION_SUBMITTED",
    payload: { type: "SUBMISSION_SUBMITTED", submissionId: "sub-2", submissionType: "VENUE", targetVenueId: "venue-1" },
  });

  assert.equal(eventSubmission.href, "/my/venues");
  assert.equal(venueSubmission.href, "/my/venues/venue-1");
  assert.ok(eventSubmission.title);
  assert.ok(venueSubmission.body);
});

test("approval and rejection templates generate expected hrefs and stable dedupe", () => {
  const approved = buildNotification({
    type: "SUBMISSION_APPROVED",
    payload: { type: "SUBMISSION_APPROVED", submissionId: "sub-1", submissionType: "EVENT", targetEventSlug: "spring-show" },
  });
  const rejectedOne = buildNotification({
    type: "SUBMISSION_REJECTED",
    payload: { type: "SUBMISSION_REJECTED", submissionId: "sub-2", submissionType: "EVENT", targetVenueId: "venue-9", decisionReason: "Needs updates" },
  });
  const rejectedTwo = buildNotification({
    type: "SUBMISSION_REJECTED",
    payload: { type: "SUBMISSION_REJECTED", submissionId: "sub-2", submissionType: "EVENT", targetVenueId: "venue-9", decisionReason: "Needs updates" },
  });

  assert.equal(approved.href, "/events/spring-show");
  assert.equal(rejectedOne.href, "/my/venues/venue-9/submit-event");
  assert.equal(rejectedOne.dedupeKey, rejectedTwo.dedupeKey);
  assert.ok(approved.title);
  assert.ok(rejectedOne.body);
});
