import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { eventIdParamSchema, zodDetails } from "@/lib/validators";

export const runtime = "nodejs";

export async function POST(_: Request, { params }: { params: Promise<{ eventId: string }> }) {
  try {
    const user = await requireAuth();
    const parsedId = eventIdParamSchema.safeParse(await params);
    if (!parsedId.success) return apiError(400, "invalid_request", "Invalid route parameter", zodDetails(parsedId.error));

    const submission = await db.submission.findUnique({
      where: { targetEventId: parsedId.data.eventId },
      include: { venue: { select: { memberships: { where: { userId: user.id }, select: { id: true } } } } },
    });

    if (!submission || submission.submitterUserId !== user.id) return apiError(403, "forbidden", "Submission owner required");
    if (!submission.venue?.memberships.length) return apiError(403, "forbidden", "Venue membership required");

    const updated = await db.submission.update({
      where: { id: submission.id },
      data: {
        status: "SUBMITTED",
        submittedAt: new Date(),
        decisionReason: null,
        decidedAt: null,
        decidedByUserId: null,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof Error && error.message === "unauthorized") {
      return apiError(401, "unauthorized", "Authentication required");
    }
    return apiError(500, "internal_error", "Unexpected server error");
  }
}
