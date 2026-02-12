import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { db } from "@/lib/db";
import { requireEditor } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requireEditor();
    const items = await db.submission.findMany({
      where: { status: "SUBMITTED" },
      orderBy: { submittedAt: "asc" },
      include: { targetEvent: true, targetVenue: true, venue: true, submitter: { select: { id: true, email: true, name: true } } },
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
