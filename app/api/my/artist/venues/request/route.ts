import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { handleRequestArtistVenueAssociation } from "@/lib/my-artist-venues-route";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  return handleRequestArtistVenueAssociation(req, {
    requireAuth,
    findOwnedArtistByUserId: async (userId) => db.artist.findUnique({ where: { userId }, select: { id: true } }),
    findPublishedVenueById: async (venueId) => db.venue.findFirst({ where: { id: venueId, isPublished: true }, select: { id: true } }),
    findAssociationByArtistAndVenue: async (artistId, venueId) => db.artistVenueAssociation.findUnique({
      where: { artistId_venueId: { artistId, venueId } },
      select: { id: true, status: true, role: true, venueId: true },
    }),
    createAssociation: async (input) => db.artistVenueAssociation.create({
      data: input,
      select: { id: true, status: true, role: true, venueId: true },
    }),
    rerequestAssociation: async (associationId, input) => db.artistVenueAssociation.update({
      where: { id: associationId },
      data: { status: "PENDING", role: input.role, message: input.message, requestedByUserId: input.requestedByUserId, reviewedAt: null, reviewedByUserId: null },
      select: { id: true, status: true, role: true, venueId: true },
    }),
  });
}
