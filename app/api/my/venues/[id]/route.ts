import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiError } from "@/lib/api";
import { requireVenueRole } from "@/lib/auth";
import { myVenuePatchSchema, parseBody, venueIdParamSchema, zodDetails } from "@/lib/validators";
import { submissionSubmittedDedupeKey } from "@/lib/notification-keys";
import { buildInAppFromTemplate, enqueueNotification } from "@/lib/notifications";

export const runtime = "nodejs";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const parsedId = venueIdParamSchema.safeParse(await params);
    if (!parsedId.success) return apiError(400, "invalid_request", "Invalid route parameter", zodDetails(parsedId.error));

    const parsedBody = myVenuePatchSchema.safeParse(await parseBody(req));
    if (!parsedBody.success) return apiError(400, "invalid_request", "Invalid payload", zodDetails(parsedBody.error));

    const user = await requireVenueRole(parsedId.data.id, "EDITOR");

    const existing = await db.venue.findUnique({ where: { id: parsedId.data.id }, select: { id: true, isPublished: true } });
    if (!existing) return apiError(404, "not_found", "Venue not found");

    const { submitForApproval, note, featuredAssetId, ...safeFields } = parsedBody.data;

    if (featuredAssetId) {
      const asset = await db.asset.findUnique({ where: { id: featuredAssetId }, select: { ownerUserId: true } });
      if (!asset || asset.ownerUserId !== user.id) return apiError(403, "forbidden", "Can only use your own uploaded assets");
    }

    const venue = await db.venue.update({ where: { id: existing.id }, data: { ...safeFields, featuredAssetId: featuredAssetId ?? null } });

    if (submitForApproval && !existing.isPublished && user.role === "USER") {
      const submission = await db.submission.upsert({
        where: { targetVenueId: existing.id },
        create: {
          type: "VENUE",
          status: "SUBMITTED",
          submitterUserId: user.id,
          venueId: existing.id,
          targetVenueId: existing.id,
          note: note ?? null,
          submittedAt: new Date(),
        },
        update: {
          status: "SUBMITTED",
          submitterUserId: user.id,
          note: note ?? null,
          decisionReason: null,
          submittedAt: new Date(),
          decidedAt: null,
          decidedByUserId: null,
        },
      });

      await enqueueNotification({
        type: "SUBMISSION_SUBMITTED",
        toEmail: user.email,
        dedupeKey: submissionSubmittedDedupeKey(submission.id),
        payload: {
          submissionId: submission.id,
          status: submission.status,
          submittedAt: submission.submittedAt?.toISOString() ?? null,
        },
        inApp: buildInAppFromTemplate(user.id, "SUBMISSION_SUBMITTED", {
          type: "SUBMISSION_SUBMITTED",
          submissionId: submission.id,
          submissionType: "VENUE",
          targetVenueId: existing.id,
        }),
      });
    }

    return NextResponse.json(venue);
  } catch (error) {
    if (error instanceof Error && error.message === "unauthorized") {
      return apiError(401, "unauthorized", "Authentication required");
    }
    if (error instanceof Error && error.message === "forbidden") {
      return apiError(403, "forbidden", "Venue membership required");
    }
    return apiError(500, "internal_error", "Unexpected server error");
  }
}
