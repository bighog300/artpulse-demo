import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { eventIdParamSchema, myEventPatchSchema, parseBody, zodDetails } from "@/lib/validators";
import { canEditSubmission } from "@/lib/ownership";

export const runtime = "nodejs";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  try {
    const user = await requireAuth();
    const parsedId = eventIdParamSchema.safeParse(await params);
    if (!parsedId.success) return apiError(400, "invalid_request", "Invalid route parameter", zodDetails(parsedId.error));
    const parsed = myEventPatchSchema.safeParse(await parseBody(req));
    if (!parsed.success) return apiError(400, "invalid_request", "Invalid payload", zodDetails(parsed.error));

    const submission = await db.submission.findUnique({
      where: { targetEventId: parsedId.data.eventId },
      include: { venue: { select: { memberships: { where: { userId: user.id }, select: { id: true } } } } },
    });

    if (!submission || submission.submitterUserId !== user.id) return apiError(403, "forbidden", "Submission owner required");
    if (!submission.venue?.memberships.length) return apiError(403, "forbidden", "Venue membership required");
    if (!canEditSubmission(submission.status)) return apiError(409, "invalid_state", "Only draft or rejected submissions are editable");

    const { note, images, ...data } = parsed.data;

    const assetIds = (images ?? []).map((image) => image.assetId).filter((assetId): assetId is string => Boolean(assetId));
    if (assetIds.length) {
      const ownedCount = await db.asset.count({ where: { id: { in: assetIds }, ownerUserId: user.id } });
      if (ownedCount !== assetIds.length) return apiError(403, "forbidden", "Can only use your own uploaded assets");
    }

    const event = await db.event.update({
      where: { id: parsedId.data.eventId },
      data: {
        ...data,
        ...(parsed.data.startAt ? { startAt: new Date(parsed.data.startAt) } : {}),
        ...(Object.prototype.hasOwnProperty.call(parsed.data, "endAt") ? { endAt: parsed.data.endAt ? new Date(parsed.data.endAt) : null } : {}),
        ...(images
          ? {
              images: {
                deleteMany: {},
                create: images.map((image) => ({
                  assetId: image.assetId ?? null,
                  url: image.url ?? "",
                  alt: image.alt ?? null,
                  sortOrder: image.sortOrder,
                })),
              },
            }
          : {}),
        isPublished: false,
        publishedAt: null,
      },
    });

    if (note !== undefined) {
      await db.submission.update({ where: { id: submission.id }, data: { note: note ?? null } });
    }

    return NextResponse.json(event);
  } catch (error) {
    if (error instanceof Error && error.message === "unauthorized") {
      return apiError(401, "unauthorized", "Authentication required");
    }
    return apiError(500, "internal_error", "Unexpected server error");
  }
}
