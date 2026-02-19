import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { apiError } from "@/lib/api";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const cursor = req.nextUrl.searchParams.get("cursor") || undefined;
    const rawLimit = Number(req.nextUrl.searchParams.get("limit") || "20");
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 50) : 20;

    const page = await db.notification.findMany({
      where: { userId: user.id },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = page.length > limit;
    const items = hasMore ? page.slice(0, limit) : page;

    return NextResponse.json({
      items,
      nextCursor: hasMore ? items[items.length - 1]?.id ?? null : null,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "unauthorized") {
      return apiError(401, "unauthorized", "Authentication required");
    }
    return apiError(500, "internal_error", "Unexpected server error");
  }
}
