import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { handleCancelArtistVenueAssociation } from "@/lib/my-artist-venues-route";

export const runtime = "nodejs";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ associationId: string }> }) {
  return handleCancelArtistVenueAssociation(req, params, {
    requireAuth,
    findOwnedArtistByUserId: async (userId) => db.artist.findUnique({ where: { userId }, select: { id: true } }),
    findAssociationById: async (associationId) => db.artistVenueAssociation.findUnique({
      where: { id: associationId },
      select: { id: true, artistId: true, status: true },
    }),
    deleteAssociationById: async (associationId) => {
      await db.artistVenueAssociation.delete({ where: { id: associationId } });
    },
  });
}
