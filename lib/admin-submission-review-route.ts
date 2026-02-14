import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { adminSubmissionRequestChangesSchema, idParamSchema, parseBody, zodDetails } from "@/lib/validators";
import { buildInAppFromTemplate, enqueueNotification } from "@/lib/notifications";
import { submissionDecisionDedupeKey } from "@/lib/notification-keys";

type EditorUser = { id: string };

type SubmissionDetail = {
  id: string;
  type: "EVENT" | "VENUE";
  targetEventId: string | null;
  targetVenueId: string | null;
  status: "SUBMITTED" | "APPROVED" | "REJECTED" | "DRAFT";
  submitter: { id: string; email: string };
  targetVenue: { slug: string | null } | null;
};

type ReviewDeps = {
  requireEditor: () => Promise<EditorUser>;
  findSubmission: (id: string) => Promise<SubmissionDetail | null>;
  publishVenue: (venueId: string) => Promise<void>;
  setVenueDraft: (venueId: string) => Promise<void>;
  publishEvent: (eventId: string) => Promise<void>;
  setEventDraft: (eventId: string) => Promise<void>;
  markApproved: (submissionId: string, decidedByUserId: string) => Promise<void>;
  markNeedsChanges: (submissionId: string, decidedByUserId: string, message: string) => Promise<void>;
  notifyApproved?: (submission: SubmissionDetail) => Promise<void>;
  notifyNeedsChanges?: (submission: SubmissionDetail, message: string) => Promise<void>;
};

async function parseSubmissionId(params: Promise<{ id: string }>) {
  const parsed = idParamSchema.safeParse(await params);
  if (!parsed.success) return { error: apiError(400, "invalid_request", "Invalid route parameter", zodDetails(parsed.error)) };
  return { submissionId: parsed.data.id };
}

export async function handleApproveSubmission(params: Promise<{ id: string }>, deps: ReviewDeps) {
  try {
    const parsedId = await parseSubmissionId(params);
    if ("error" in parsedId) return parsedId.error;

    const editor = await deps.requireEditor();
    const submission = await deps.findSubmission(parsedId.submissionId);
    if (!submission) {
      return apiError(400, "invalid_request", "Submission not found");
    }
    if (submission.status !== "SUBMITTED") return apiError(400, "invalid_request", "Submission is not pending review");

    if (submission.type === "VENUE") {
      if (!submission.targetVenueId) return apiError(400, "invalid_request", "Venue submission not found");
      await deps.publishVenue(submission.targetVenueId);
    } else {
      if (!submission.targetEventId) return apiError(400, "invalid_request", "Event submission not found");
      await deps.publishEvent(submission.targetEventId);
    }
    await deps.markApproved(submission.id, editor.id);

    if (deps.notifyApproved) {
      await deps.notifyApproved(submission);
    } else {
      await enqueueNotification({
        type: "SUBMISSION_APPROVED",
        toEmail: submission.submitter.email,
        dedupeKey: submissionDecisionDedupeKey(submission.id, "APPROVED"),
        payload: { submissionId: submission.id, status: "APPROVED" },
        inApp: buildInAppFromTemplate(submission.submitter.id, "SUBMISSION_APPROVED", {
          type: "SUBMISSION_APPROVED",
          submissionId: submission.id,
          submissionType: submission.type,
          targetVenueSlug: submission.targetVenue?.slug ?? undefined,
        }),
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "unauthorized") return apiError(401, "unauthorized", "Authentication required");
    if (error instanceof Error && error.message === "forbidden") return apiError(403, "forbidden", "Editor role required");
    return apiError(500, "internal_error", "Unexpected server error");
  }
}

export async function handleRequestChangesSubmission(req: NextRequest, params: Promise<{ id: string }>, deps: ReviewDeps) {
  try {
    const parsedId = await parseSubmissionId(params);
    if ("error" in parsedId) return parsedId.error;

    const parsedBody = adminSubmissionRequestChangesSchema.safeParse(await parseBody(req));
    if (!parsedBody.success) return apiError(400, "invalid_request", "Invalid payload", zodDetails(parsedBody.error));

    const editor = await deps.requireEditor();
    const submission = await deps.findSubmission(parsedId.submissionId);
    if (!submission) {
      return apiError(400, "invalid_request", "Submission not found");
    }
    if (submission.status !== "SUBMITTED") return apiError(400, "invalid_request", "Submission is not pending review");

    if (submission.type === "VENUE") {
      if (!submission.targetVenueId) return apiError(400, "invalid_request", "Venue submission not found");
      await deps.setVenueDraft(submission.targetVenueId);
    } else {
      if (!submission.targetEventId) return apiError(400, "invalid_request", "Event submission not found");
      await deps.setEventDraft(submission.targetEventId);
    }
    await deps.markNeedsChanges(submission.id, editor.id, parsedBody.data.message);

    if (deps.notifyNeedsChanges) {
      await deps.notifyNeedsChanges(submission, parsedBody.data.message);
    } else {
      await enqueueNotification({
        type: "SUBMISSION_REJECTED",
        toEmail: submission.submitter.email,
        dedupeKey: submissionDecisionDedupeKey(submission.id, "REJECTED"),
        payload: { submissionId: submission.id, status: "REJECTED", decisionReason: parsedBody.data.message },
        inApp: buildInAppFromTemplate(submission.submitter.id, "SUBMISSION_REJECTED", {
          type: "SUBMISSION_REJECTED",
          submissionId: submission.id,
          submissionType: submission.type,
          targetVenueId: submission.targetVenueId,
          decisionReason: parsedBody.data.message,
        }),
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "unauthorized") return apiError(401, "unauthorized", "Authentication required");
    if (error instanceof Error && error.message === "forbidden") return apiError(403, "forbidden", "Editor role required");
    return apiError(500, "internal_error", "Unexpected server error");
  }
}
