import { NotificationType } from "@prisma/client";
import { inviteCreatedDedupeKey, submissionDecisionDedupeKey, submissionSubmittedDedupeKey } from "@/lib/notification-keys";

export type NotificationTemplatePayload =
  | {
      type: "INVITE_CREATED";
      inviteId: string;
      inviteToken?: string | null;
      venueId?: string | null;
      role?: string | null;
    }
  | {
      type: "SUBMISSION_SUBMITTED";
      submissionId: string;
      submissionType?: "EVENT" | "VENUE";
      targetVenueId?: string | null;
    }
  | {
      type: "SUBMISSION_APPROVED";
      submissionId: string;
      submissionType?: "EVENT" | "VENUE";
      targetEventSlug?: string | null;
      targetVenueSlug?: string | null;
    }
  | {
      type: "SUBMISSION_REJECTED";
      submissionId: string;
      submissionType?: "EVENT" | "VENUE";
      targetVenueId?: string | null;
      decisionReason?: string | null;
    };

export function buildNotification({ type, payload }: { type: NotificationType; payload: NotificationTemplatePayload }) {
  if (type === "INVITE_CREATED" && payload.type === "INVITE_CREATED") {
    const href = payload.inviteToken ? `/invite/${payload.inviteToken}` : payload.venueId ? `/my/venues/${payload.venueId}` : undefined;
    return {
      title: "You've been invited to manage a venue",
      body: `You were invited as ${(payload.role ?? "editor").toLowerCase()} to collaborate on a venue.`,
      href,
      dedupeKey: inviteCreatedDedupeKey(payload.inviteId),
    };
  }

  if (type === "SUBMISSION_SUBMITTED" && payload.type === "SUBMISSION_SUBMITTED") {
    const href = payload.submissionType === "VENUE" && payload.targetVenueId ? `/my/venues/${payload.targetVenueId}` : "/my/venues";
    return {
      title: "Submission sent for review",
      body: payload.submissionType === "VENUE" ? "Your venue submission is now pending moderation." : "Your event submission is now pending moderation.",
      href,
      dedupeKey: submissionSubmittedDedupeKey(payload.submissionId),
    };
  }

  if (type === "SUBMISSION_APPROVED" && payload.type === "SUBMISSION_APPROVED") {
    const href = payload.submissionType === "EVENT" && payload.targetEventSlug
      ? `/events/${payload.targetEventSlug}`
      : payload.submissionType === "VENUE" && payload.targetVenueSlug
        ? `/venues/${payload.targetVenueSlug}`
        : undefined;

    return {
      title: "Submission approved",
      body: "Your submission has been approved and published.",
      href,
      dedupeKey: submissionDecisionDedupeKey(payload.submissionId, "APPROVED"),
    };
  }

  if (type === "SUBMISSION_REJECTED" && payload.type === "SUBMISSION_REJECTED") {
    const href = payload.submissionType === "EVENT" && payload.targetVenueId
      ? `/my/venues/${payload.targetVenueId}/submit-event`
      : payload.submissionType === "VENUE" && payload.targetVenueId
        ? `/my/venues/${payload.targetVenueId}`
        : undefined;

    return {
      title: "Submission needs changes",
      body: payload.decisionReason ?? "Your submission was rejected by moderation.",
      href,
      dedupeKey: submissionDecisionDedupeKey(payload.submissionId, "REJECTED"),
    };
  }

  throw new Error("notification_template_payload_mismatch");
}
