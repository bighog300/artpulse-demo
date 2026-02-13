import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { listSnapshotsSchema } from "@/lib/perf/service";
import { paramsToObject, zodDetails } from "@/lib/validators";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const parsed = listSnapshotsSchema.safeParse(paramsToObject(req.nextUrl.searchParams));
    if (!parsed.success) return apiError(400, "invalid_request", "Invalid query parameters", zodDetails(parsed.error));

    const items = await db.perfSnapshot.findMany({
      where: {
        ...(parsed.data.name ? { name: parsed.data.name } : {}),
      },
      take: parsed.data.limit + 1,
      ...(parsed.data.cursor ? { skip: 1, cursor: { id: parsed.data.cursor } } : {}),
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: { id: true, name: true, createdAt: true, paramsJson: true },
    });

    const hasMore = items.length > parsed.data.limit;
    const pageItems = hasMore ? items.slice(0, parsed.data.limit) : items;

    return NextResponse.json({
      items: pageItems,
      nextCursor: hasMore ? pageItems[pageItems.length - 1]?.id ?? null : null,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "unauthorized") return apiError(401, "unauthorized", "Authentication required");
    if (error instanceof Error && error.message === "forbidden") return apiError(403, "forbidden", "Admin role required");
    return apiError(500, "internal_error", "Unexpected server error");
  }
}
