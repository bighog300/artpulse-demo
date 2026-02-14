import { db } from "@/lib/db";
import { requireEditor } from "@/lib/auth";
import { handleApproveSubmission } from "@/lib/admin-submission-review-route";

export const runtime = "nodejs";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  return handleApproveSubmission(params, {
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
    publishVenue: async (venueId) => {
      await db.venue.update({ where: { id: venueId }, data: { isPublished: true } });
    },
    setVenueDraft: async () => undefined,
    markApproved: async (submissionId, decidedByUserId) => {
      await db.submission.update({
        where: { id: submissionId },
        data: { status: "APPROVED", decidedByUserId, decidedAt: new Date(), decisionReason: null },
      });
    },
    markNeedsChanges: async () => undefined,
  });
}
