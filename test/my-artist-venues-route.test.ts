import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { handleRequestArtistVenueAssociation } from "@/lib/my-artist-venues-route";

const venueId = "11111111-1111-4111-8111-111111111111";

test("artist venue request requires auth", async () => {
  const req = new NextRequest("http://localhost/api/my/artist/venues/request", { method: "POST" });
  const res = await handleRequestArtistVenueAssociation(req, {
    requireAuth: async () => { throw new Error("unauthorized"); },
    findOwnedArtistByUserId: async () => ({ id: "artist-1" }),
    findPublishedVenueById: async () => ({ id: venueId }),
    findAssociationByArtistAndVenue: async () => null,
    createAssociation: async () => ({ id: "assoc-1", status: "PENDING", role: null, venueId }),
    rerequestAssociation: async () => ({ id: "assoc-1", status: "PENDING", role: null, venueId }),
  });
  assert.equal(res.status, 401);
});

test("artist venue request forbids when user has no artist", async () => {
  const req = new NextRequest("http://localhost/api/my/artist/venues/request", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ venueId }),
  });
  const res = await handleRequestArtistVenueAssociation(req, {
    requireAuth: async () => ({ id: "user-1" }),
    findOwnedArtistByUserId: async () => null,
    findPublishedVenueById: async () => ({ id: venueId }),
    findAssociationByArtistAndVenue: async () => null,
    createAssociation: async () => ({ id: "assoc-1", status: "PENDING", role: null, venueId }),
    rerequestAssociation: async () => ({ id: "assoc-1", status: "PENDING", role: null, venueId }),
  });
  assert.equal(res.status, 403);
});

test("artist venue request rejects invalid venueId", async () => {
  const req = new NextRequest("http://localhost/api/my/artist/venues/request", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ venueId: "bad-id" }),
  });
  const res = await handleRequestArtistVenueAssociation(req, {
    requireAuth: async () => ({ id: "user-1" }),
    findOwnedArtistByUserId: async () => ({ id: "artist-1" }),
    findPublishedVenueById: async () => ({ id: venueId }),
    findAssociationByArtistAndVenue: async () => null,
    createAssociation: async () => ({ id: "assoc-1", status: "PENDING", role: null, venueId }),
    rerequestAssociation: async () => ({ id: "assoc-1", status: "PENDING", role: null, venueId }),
  });
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.equal(body.error, "invalid_request");
});

test("artist venue request success returns pending", async () => {
  const req = new NextRequest("http://localhost/api/my/artist/venues/request", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ venueId, role: "represented_by" }),
  });
  const res = await handleRequestArtistVenueAssociation(req, {
    requireAuth: async () => ({ id: "user-1" }),
    findOwnedArtistByUserId: async () => ({ id: "artist-1" }),
    findPublishedVenueById: async () => ({ id: venueId }),
    findAssociationByArtistAndVenue: async () => null,
    createAssociation: async () => ({ id: "assoc-1", status: "PENDING", role: "represented_by", venueId }),
    rerequestAssociation: async () => ({ id: "assoc-1", status: "PENDING", role: null, venueId }),
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.association.status, "PENDING");
});

test("artist venue request again pending/approved invalid and rejected reopens", async () => {
  const makeReq = () => new NextRequest("http://localhost/api/my/artist/venues/request", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ venueId }),
  });

  const pendingRes = await handleRequestArtistVenueAssociation(makeReq(), {
    requireAuth: async () => ({ id: "user-1" }),
    findOwnedArtistByUserId: async () => ({ id: "artist-1" }),
    findPublishedVenueById: async () => ({ id: venueId }),
    findAssociationByArtistAndVenue: async () => ({ id: "assoc-1", status: "PENDING", role: null, venueId }),
    createAssociation: async () => ({ id: "assoc-1", status: "PENDING", role: null, venueId }),
    rerequestAssociation: async () => ({ id: "assoc-1", status: "PENDING", role: null, venueId }),
  });
  assert.equal(pendingRes.status, 400);

  const approvedRes = await handleRequestArtistVenueAssociation(makeReq(), {
    requireAuth: async () => ({ id: "user-1" }),
    findOwnedArtistByUserId: async () => ({ id: "artist-1" }),
    findPublishedVenueById: async () => ({ id: venueId }),
    findAssociationByArtistAndVenue: async () => ({ id: "assoc-1", status: "APPROVED", role: null, venueId }),
    createAssociation: async () => ({ id: "assoc-1", status: "PENDING", role: null, venueId }),
    rerequestAssociation: async () => ({ id: "assoc-1", status: "PENDING", role: null, venueId }),
  });
  assert.equal(approvedRes.status, 400);

  let reopened = false;
  const rejectedRes = await handleRequestArtistVenueAssociation(makeReq(), {
    requireAuth: async () => ({ id: "user-1" }),
    findOwnedArtistByUserId: async () => ({ id: "artist-1" }),
    findPublishedVenueById: async () => ({ id: venueId }),
    findAssociationByArtistAndVenue: async () => ({ id: "assoc-1", status: "REJECTED", role: null, venueId }),
    createAssociation: async () => ({ id: "assoc-1", status: "PENDING", role: null, venueId }),
    rerequestAssociation: async () => {
      reopened = true;
      return { id: "assoc-1", status: "PENDING", role: null, venueId };
    },
  });
  assert.equal(rejectedRes.status, 200);
  assert.equal(reopened, true);
});
