import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { idParamSchema, zodDetails } from "@/lib/validators";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const params = await context.params;
    const parsed = idParamSchema.safeParse(params);
    if (!parsed.success) return apiError(400, "invalid_request", "Invalid id", zodDetails(parsed.error));

    const snapshot = await db.perfSnapshot.findUnique({
      where: { id: parsed.data.id },
      select: { id: true, name: true, createdAt: true, createdByUserId: true, paramsJson: true, explainText: true, durationMs: true },
    });

    if (!snapshot) return apiError(404, "not_found", "Snapshot not found");
    return NextResponse.json(snapshot);
  } catch (error) {
    if (error instanceof Error && error.message === "unauthorized") return apiError(401, "unauthorized", "Authentication required");
    if (error instanceof Error && error.message === "forbidden") return apiError(403, "forbidden", "Admin role required");
    return apiError(500, "internal_error", "Unexpected server error");
  }
}
