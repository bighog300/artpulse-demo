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
  return handleModerateVenueArtistRequest(req, params, "REJECTED", {
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
        type: "SUBMISSION_REJECTED",
        toEmail: user.email,
        dedupeKey: submissionDecisionDedupeKey(input.associationId, "REJECTED"),
        payload: { type: "SUBMISSION_REJECTED", submissionId: input.associationId, submissionType: "ARTIST", targetArtistId: input.userId },
        inApp: buildInAppFromTemplate(input.userId, "SUBMISSION_REJECTED", {
          type: "SUBMISSION_REJECTED",
          submissionId: input.associationId,
          submissionType: "ARTIST",
          targetArtistId: input.userId,
          decisionReason: `${input.artistName} association request was rejected by venue staff.`,
        }),
      });
    },
  });
}
