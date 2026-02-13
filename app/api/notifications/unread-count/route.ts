import { defaultUnreadCountDeps, unreadCountResponse } from "@/lib/notifications-unread-count";

export const runtime = "nodejs";

export async function GET() {
  return unreadCountResponse(defaultUnreadCountDeps());
}
