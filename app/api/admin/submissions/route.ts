import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { db } from "@/lib/db";
import { requireEditor } from "@/lib/auth";

export const runtime = "nodejs";

const allowedStatuses = ["SUBMITTED", "APPROVED", "REJECTED"] as const;
type SubmissionStatusFilter = (typeof allowedStatuses)[number];

export async function GET(req: NextRequest) {
  try {
    await requireEditor();
    const limit = Math.min(100, Math.max(1, Number(req.nextUrl.searchParams.get("limit") || "50")));
    const cursor = req.nextUrl.searchParams.get("cursor") || undefined;
    const rawStatus = req.nextUrl.searchParams.get("status") || "SUBMITTED";
    const status: SubmissionStatusFilter = allowedStatuses.includes(rawStatus as SubmissionStatusFilter) ? (rawStatus as SubmissionStatusFilter) : "SUBMITTED";

    const items = await db.submission.findMany({
      where: { status },
      take: limit,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: [{ submittedAt: "asc" }, { id: "asc" }],
      select: {
        id: true,
        type: true,
        status: true,
        note: true,
        decisionReason: true,
        submittedAt: true,
        decidedAt: true,
        venue: { select: { id: true, name: true } },
        targetEvent: { select: { id: true, title: true, slug: true } },
        targetVenue: { select: { id: true, name: true, slug: true } },
        submitter: { select: { id: true, email: true, name: true } },
      },
    });
    return NextResponse.json(items);
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
