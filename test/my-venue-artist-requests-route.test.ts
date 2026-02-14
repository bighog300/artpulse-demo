import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { handleModerateVenueArtistRequest } from "@/lib/my-venue-artist-requests-route";

const venueId = "11111111-1111-4111-8111-111111111111";
const associationId = "22222222-2222-4222-8222-222222222222";

test("venue approve forbidden when not member", async () => {
  const req = new NextRequest(`http://localhost/api/my/venues/${venueId}/artist-requests/${associationId}/approve`, { method: "POST" });
  const res = await handleModerateVenueArtistRequest(req, Promise.resolve({ id: venueId, associationId }), "APPROVED", {
    requireAuth: async () => ({ id: "user-1", email: "u@example.com" }),
    requireVenueMembership: async () => { throw new Error("forbidden"); },
    findAssociationById: async () => null,
    updateAssociationStatus: async () => ({ id: associationId, status: "APPROVED" }),
  });
  assert.equal(res.status, 403);
});

test("venue approve invalid association", async () => {
  const req = new NextRequest(`http://localhost/api/my/venues/${venueId}/artist-requests/${associationId}/approve`, { method: "POST" });
  const res = await handleModerateVenueArtistRequest(req, Promise.resolve({ id: venueId, associationId }), "APPROVED", {
    requireAuth: async () => ({ id: "user-1", email: "u@example.com" }),
    requireVenueMembership: async () => undefined,
    findAssociationById: async () => null,
    updateAssociationStatus: async () => ({ id: associationId, status: "APPROVED" }),
  });
  assert.equal(res.status, 400);
});

test("venue approve success", async () => {
  const req = new NextRequest(`http://localhost/api/my/venues/${venueId}/artist-requests/${associationId}/approve`, { method: "POST" });
  const res = await handleModerateVenueArtistRequest(req, Promise.resolve({ id: venueId, associationId }), "APPROVED", {
    requireAuth: async () => ({ id: "user-1", email: "u@example.com" }),
    requireVenueMembership: async () => undefined,
    findAssociationById: async () => ({ id: associationId, venueId, status: "PENDING", artist: { userId: null, name: "Artist" } }),
    updateAssociationStatus: async () => ({ id: associationId, status: "APPROVED" }),
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.association.status, "APPROVED");
});

test("venue reject success", async () => {
  const req = new NextRequest(`http://localhost/api/my/venues/${venueId}/artist-requests/${associationId}/reject`, { method: "POST" });
  const res = await handleModerateVenueArtistRequest(req, Promise.resolve({ id: venueId, associationId }), "REJECTED", {
    requireAuth: async () => ({ id: "user-1", email: "u@example.com" }),
    requireVenueMembership: async () => undefined,
    findAssociationById: async () => ({ id: associationId, venueId, status: "PENDING", artist: { userId: null, name: "Artist" } }),
    updateAssociationStatus: async () => ({ id: associationId, status: "REJECTED" }),
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.association.status, "REJECTED");
});
