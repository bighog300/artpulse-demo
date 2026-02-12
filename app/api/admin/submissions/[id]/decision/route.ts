import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { db } from "@/lib/db";
import { requireEditor } from "@/lib/auth";
import { idParamSchema, parseBody, submissionDecisionSchema, zodDetails } from "@/lib/validators";
import { submissionDecisionDedupeKey } from "@/lib/notification-keys";
import { enqueueNotification } from "@/lib/notifications";

export const runtime = "nodejs";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireEditor();
    const parsedId = idParamSchema.safeParse(await params);
    if (!parsedId.success) return apiError(400, "invalid_request", "Invalid route parameter", zodDetails(parsedId.error));
    const parsedBody = submissionDecisionSchema.safeParse(await parseBody(req));
    if (!parsedBody.success) return apiError(400, "invalid_request", "Invalid payload", zodDetails(parsedBody.error));

    const submission = await db.submission.findUnique({ where: { id: parsedId.data.id }, include: { submitter: { select: { email: true } } } });
    if (!submission) return apiError(404, "not_found", "Submission not found");
    if (submission.status !== "SUBMITTED") return apiError(409, "invalid_state", "Submission is not pending moderation");

    if (parsedBody.data.action === "approve") {
      if (submission.type === "EVENT" && submission.targetEventId) {
        await db.event.update({ where: { id: submission.targetEventId }, data: { isPublished: true, publishedAt: new Date() } });
      }
      if (submission.type === "VENUE" && submission.targetVenueId) {
        await db.venue.update({ where: { id: submission.targetVenueId }, data: { isPublished: true } });
      }

      const updated = await db.submission.update({
        where: { id: submission.id },
        data: {
          status: "APPROVED",
          decidedByUserId: user.id,
          decidedAt: new Date(),
          decisionReason: null,
        },
      });
      await enqueueNotification({
        type: "SUBMISSION_APPROVED",
        toEmail: submission.submitter.email,
        dedupeKey: submissionDecisionDedupeKey(submission.id, "APPROVED"),
        payload: {
          submissionId: updated.id,
          status: updated.status,
          decidedAt: updated.decidedAt?.toISOString() ?? null,
        },
      });
      return NextResponse.json(updated);
    }

    const updated = await db.submission.update({
      where: { id: submission.id },
      data: {
        status: "REJECTED",
        decidedByUserId: user.id,
        decidedAt: new Date(),
        decisionReason: parsedBody.data.decisionReason ?? "Rejected by moderator",
      },
    });
    await enqueueNotification({
      type: "SUBMISSION_REJECTED",
      toEmail: submission.submitter.email,
      dedupeKey: submissionDecisionDedupeKey(submission.id, "REJECTED"),
      payload: {
        submissionId: updated.id,
        status: updated.status,
        decisionReason: updated.decisionReason,
        decidedAt: updated.decidedAt?.toISOString() ?? null,
      },
    });
    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof Error && error.message === "unauthorized") {
      return apiError(401, "unauthorized", "Authentication required");
    }
    if (error instanceof Error && error.message === "forbidden") {
      return apiError(403, "forbidden", "Editor role required");
    }
    return apiError(500, "internal_error", "Unexpected server error");
  }
}
