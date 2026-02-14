import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { buildInAppFromTemplate, enqueueNotification, submissionDecisionDedupeKey } from "@/lib/notifications";
import { handleModerateVenueArtistRequest } from "@/lib/my-venue-artist-requests-route";

export const runtime = "nodejs";

async function requireVenueMembership(userId: string, venueId: string) {
  const membership = await db.venueMembership.findUnique({ where: { userId_venueId: { userId, venueId } }, select: { id: true } });
  if (!membership) throw new Error("forbidden");
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string; associationId: string }> }) {
  return handleModerateVenueArtistRequest(req, params, "APPROVED", {
    requireAuth,
    requireVenueMembership,
    findAssociationById: async (associationId) => db.artistVenueAssociation.findUnique({
      where: { id: associationId },
      select: { id: true, venueId: true, status: true, artist: { select: { userId: true, name: true } } },
    }),
    updateAssociationStatus: async (associationId, input) => db.artistVenueAssociation.update({
      where: { id: associationId },
      data: input,
      select: { id: true, status: true },
    }),
    notifyArtistOwner: async (input) => {
      const user = await db.user.findUnique({ where: { id: input.userId }, select: { email: true } });
      if (!user?.email) return;
      await enqueueNotification({
        type: "SUBMISSION_APPROVED",
        toEmail: user.email,
        dedupeKey: submissionDecisionDedupeKey(input.associationId, "APPROVED"),
        payload: { type: "SUBMISSION_APPROVED", submissionId: input.associationId, submissionType: "ARTIST" },
        inApp: buildInAppFromTemplate(input.userId, "SUBMISSION_APPROVED", {
          type: "SUBMISSION_APPROVED",
          submissionId: input.associationId,
          submissionType: "ARTIST",
          targetArtistSlug: null,
        }),
      });
    },
  });
}
