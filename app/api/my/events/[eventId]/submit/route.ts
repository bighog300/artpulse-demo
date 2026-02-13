import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { eventIdParamSchema, zodDetails } from "@/lib/validators";
import { nextSubmissionStatusForSubmit } from "@/lib/ownership";
import { submissionSubmittedDedupeKey } from "@/lib/notification-keys";
import { buildInAppFromTemplate, enqueueNotification } from "@/lib/notifications";
import { RATE_LIMITS, enforceRateLimit, isRateLimitError, rateLimitErrorResponse } from "@/lib/rate-limit";
import { setOnboardingFlag } from "@/lib/onboarding";

export const runtime = "nodejs";

export async function POST(_: Request, { params }: { params: Promise<{ eventId: string }> }) {
  try {
    const user = await requireAuth();

    await enforceRateLimit({
      key: `submissions:submit:user:${user.id}`,
      limit: RATE_LIMITS.submissions.limit,
      windowMs: RATE_LIMITS.submissions.windowMs,
    });

    const parsedId = eventIdParamSchema.safeParse(await params);
    if (!parsedId.success) return apiError(400, "invalid_request", "Invalid route parameter", zodDetails(parsedId.error));

    const submission = await db.submission.findUnique({
      where: { targetEventId: parsedId.data.eventId },
      include: { venue: { select: { memberships: { where: { userId: user.id }, select: { id: true } } } } },
    });

    if (!submission || submission.submitterUserId !== user.id) return apiError(403, "forbidden", "Submission owner required");
    if (!submission.venue?.memberships.length) return apiError(403, "forbidden", "Venue membership required");
    const nextStatus = nextSubmissionStatusForSubmit(submission.status);
    if (!nextStatus) return apiError(409, "invalid_state", "Only draft or rejected submissions can be submitted");

    const updated = await db.submission.update({
      where: { id: submission.id },
      data: {
        status: nextStatus,
        submittedAt: new Date(),
        decisionReason: null,
        decidedAt: null,
        decidedByUserId: null,
      },
    });

    await enqueueNotification({
      type: "SUBMISSION_SUBMITTED",
      toEmail: user.email,
      dedupeKey: submissionSubmittedDedupeKey(updated.id),
      payload: {
        submissionId: updated.id,
        status: updated.status,
        submittedAt: updated.submittedAt?.toISOString() ?? null,
      },
      inApp: buildInAppFromTemplate(user.id, "SUBMISSION_SUBMITTED", {
        type: "SUBMISSION_SUBMITTED",
        submissionId: updated.id,
        submissionType: "EVENT",
      }),
    });

    await setOnboardingFlag(user.id, "hasSubmittedEvent");

    return NextResponse.json(updated);
  } catch (error) {
    if (isRateLimitError(error)) return rateLimitErrorResponse(error);
    if (error instanceof Error && error.message === "unauthorized") {
      return apiError(401, "unauthorized", "Authentication required");
    }
    return apiError(500, "internal_error", "Unexpected server error");
  }
}
