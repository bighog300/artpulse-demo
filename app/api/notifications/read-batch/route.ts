import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notificationsReadBatchSchema, parseBody, zodDetails } from "@/lib/validators";
import { scopedReadBatchIds } from "@/lib/notifications-read-batch";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const parsed = notificationsReadBatchSchema.safeParse(await parseBody(req));
    if (!parsed.success) return apiError(400, "invalid_request", "Invalid read batch payload", zodDetails(parsed.error));

    const owned = await db.notification.findMany({ where: { userId: user.id, id: { in: parsed.data.ids } }, select: { id: true } });
    const ids = scopedReadBatchIds(parsed.data.ids, owned.map((item) => item.id));

    if (!ids.length) return NextResponse.json({ ok: true, updated: 0 });

    const result = await db.notification.updateMany({ where: { userId: user.id, id: { in: ids } }, data: { status: "READ" } });
    return NextResponse.json({ ok: true, updated: result.count });
  } catch (error) {
    if (error instanceof Error && error.message === "unauthorized") {
      return apiError(401, "unauthorized", "Authentication required");
    }
    return apiError(500, "internal_error", "Unexpected server error");
  }
}
