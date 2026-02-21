import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { handleVenueSubmit } from "../lib/my-venue-submit-route.ts";

const venueId = "11111111-1111-4111-8111-111111111111";

const completeVenue = {
  id: venueId,
  name: "Gallery Aurora",
  description: "A contemporary gallery focused on experimental installations and long-form exhibitions.",
  featuredAssetId: "22222222-2222-4222-8222-222222222222",
  featuredImageUrl: null,
  addressLine1: "123 Main",
  city: "Lisbon",
  country: "Portugal",
  websiteUrl: "https://aurora.example",
  images: [{ id: "33333333-3333-4333-8333-333333333333" }],
};

function buildReq() {
  return new NextRequest(`http://localhost/api/my/venues/${venueId}/submit`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ message: "Ready for review" }),
  });
}

test("handleVenueSubmit returns unauthorized when user is anonymous", async () => {
  const req = new NextRequest(`http://localhost/api/my/venues/${venueId}/submit`, { method: "POST" });
  const res = await handleVenueSubmit(req, Promise.resolve({ id: venueId }), {
    requireAuth: async () => { throw new Error("unauthorized"); },
    requireVenueMembership: async () => undefined,
    findVenueForSubmit: async () => completeVenue,
    upsertSubmission: async () => ({ id: "sub-1", status: "SUBMITTED", createdAt: new Date(), submittedAt: new Date() }),
    setVenuePublishedDraft: async () => undefined,
    enqueueSubmissionNotification: async () => undefined,
  });

  assert.equal(res.status, 401);
  const body = await res.json();
  assert.equal(body.error.code, "unauthorized");
});

test("handleVenueSubmit returns forbidden when user is not venue member", async () => {
  const req = new NextRequest(`http://localhost/api/my/venues/${venueId}/submit`, { method: "POST" });
  const res = await handleVenueSubmit(req, Promise.resolve({ id: venueId }), {
    requireAuth: async () => ({ id: "user-1", email: "user@example.com" }),
    requireVenueMembership: async () => { throw new Error("forbidden"); },
    findVenueForSubmit: async () => completeVenue,
    upsertSubmission: async () => ({ id: "sub-1", status: "SUBMITTED", createdAt: new Date(), submittedAt: new Date() }),
    setVenuePublishedDraft: async () => undefined,
    enqueueSubmissionNotification: async () => undefined,
  });

  assert.equal(res.status, 403);
  const body = await res.json();
  assert.equal(body.error.code, "forbidden");
});

test("handleVenueSubmit allows site ADMIN to publish without venue membership", async () => {
  const req = buildReq();
  const res = await handleVenueSubmit(req, Promise.resolve({ id: venueId }), {
    requireAuth: async () => ({ id: "admin-1", email: "admin@example.com" }),
    requireVenueMembership: async () => undefined,
    findVenueForSubmit: async () => completeVenue,
    upsertSubmission: async () => ({ id: "sub-admin", status: "SUBMITTED", createdAt: new Date(), submittedAt: new Date() }),
    setVenuePublishedDraft: async () => undefined,
    enqueueSubmissionNotification: async () => undefined,
  });

  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.submission.id, "sub-admin");
});

test("handleVenueSubmit allows venue OWNER to publish", async () => {
  const req = buildReq();
  const res = await handleVenueSubmit(req, Promise.resolve({ id: venueId }), {
    requireAuth: async () => ({ id: "owner-1", email: "owner@example.com" }),
    requireVenueMembership: async () => undefined,
    findVenueForSubmit: async () => completeVenue,
    upsertSubmission: async () => ({ id: "sub-owner", status: "SUBMITTED", createdAt: new Date(), submittedAt: new Date() }),
    setVenuePublishedDraft: async () => undefined,
    enqueueSubmissionNotification: async () => undefined,
  });

  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.submission.id, "sub-owner");
});

test("handleVenueSubmit blocks users who are not OWNER/EDITOR/ADMIN", async () => {
  const req = buildReq();
  const res = await handleVenueSubmit(req, Promise.resolve({ id: venueId }), {
    requireAuth: async () => ({ id: "user-2", email: "user2@example.com" }),
    requireVenueMembership: async () => { throw new Error("forbidden"); },
    findVenueForSubmit: async () => completeVenue,
    upsertSubmission: async () => ({ id: "sub-1", status: "SUBMITTED", createdAt: new Date(), submittedAt: new Date() }),
    setVenuePublishedDraft: async () => undefined,
    enqueueSubmissionNotification: async () => undefined,
  });

  assert.equal(res.status, 403);
  const body = await res.json();
  assert.equal(body.error.code, "forbidden");
});

test("handleVenueSubmit returns invalid_request with issues when venue is incomplete", async () => {
  const req = new NextRequest(`http://localhost/api/my/venues/${venueId}/submit`, { method: "POST" });
  const res = await handleVenueSubmit(req, Promise.resolve({ id: venueId }), {
    requireAuth: async () => ({ id: "user-1", email: "user@example.com" }),
    requireVenueMembership: async () => undefined,
    findVenueForSubmit: async () => ({ ...completeVenue, description: "short", featuredAssetId: null, images: [] }),
    upsertSubmission: async () => ({ id: "sub-1", status: "SUBMITTED", createdAt: new Date(), submittedAt: new Date() }),
    setVenuePublishedDraft: async () => undefined,
    enqueueSubmissionNotification: async () => undefined,
  });

  assert.equal(res.status, 400);
  const body = await res.json();
  assert.equal(body.error.code, "invalid_request");
  assert.equal(Array.isArray(body.error.details.issues), true);
});

test("handleVenueSubmit creates submission when venue is complete", async () => {
  let created = false;
  const req = new NextRequest(`http://localhost/api/my/venues/${venueId}/submit`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ message: "Ready for review" }),
  });
  const res = await handleVenueSubmit(req, Promise.resolve({ id: venueId }), {
    requireAuth: async () => ({ id: "user-1", email: "user@example.com" }),
    requireVenueMembership: async () => undefined,
    findVenueForSubmit: async () => completeVenue,
    upsertSubmission: async (input) => {
      created = true;
      assert.equal(input.message, "Ready for review");
      return { id: "sub-1", status: "SUBMITTED", createdAt: new Date("2026-01-01T00:00:00.000Z"), submittedAt: new Date() };
    },
    setVenuePublishedDraft: async () => undefined,
    enqueueSubmissionNotification: async () => undefined,
  });

  assert.equal(res.status, 200);
  assert.equal(created, true);
  const body = await res.json();
  assert.equal(body.submission.id, "sub-1");
  assert.equal(body.submission.status, "SUBMITTED");
});
