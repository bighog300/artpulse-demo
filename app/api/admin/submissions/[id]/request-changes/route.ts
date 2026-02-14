import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireEditor } from "@/lib/auth";
import { handleRequestChangesSubmission } from "@/lib/admin-submission-review-route";

export const runtime = "nodejs";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return handleRequestChangesSubmission(req, params, {
    requireEditor,
    findSubmission: async (id) => db.submission.findUnique({
      where: { id },
      select: {
        id: true,
        type: true,
        targetVenueId: true,
        status: true,
        submitter: { select: { id: true, email: true } },
        targetVenue: { select: { slug: true } },
      },
    }),
    publishVenue: async () => undefined,
    setVenueDraft: async (venueId) => {
      await db.venue.update({ where: { id: venueId }, data: { isPublished: false } });
    },
    markApproved: async () => undefined,
    markNeedsChanges: async (submissionId, decidedByUserId, message) => {
      await db.submission.update({
        where: { id: submissionId },
        data: { status: "REJECTED", decidedByUserId, decidedAt: new Date(), decisionReason: message },
      });
    },
  });
}
