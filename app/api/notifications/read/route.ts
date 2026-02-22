import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { ensureDbUserForSession } from "@/lib/ensure-db-user-for-session";
import { getSessionUser } from "@/lib/auth";
import { countUnreadNotifications, markNotificationsRead } from "@/lib/notifications";
import { db } from "@/lib/db";
import { notificationsReadSchema, parseBody, zodDetails } from "@/lib/validators";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const sessionUser = await getSessionUser();
    const user = await ensureDbUserForSession(sessionUser);
    if (!user) return apiError(401, "unauthorized", "Authentication required");

    const parsed = notificationsReadSchema.safeParse(await parseBody(req));
    if (!parsed.success) return apiError(400, "invalid_request", "Invalid payload", zodDetails(parsed.error));

    await markNotificationsRead(db, user.id, parsed.data);
    const unreadCount = await countUnreadNotifications(db, user.id);
    return NextResponse.json({ ok: true, unreadCount }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return apiError(500, "internal_error", "Unexpected server error");
  }
}
