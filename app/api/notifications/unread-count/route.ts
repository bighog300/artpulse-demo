import { defaultUnreadCountDeps, unreadCountResponse } from "@/lib/notifications-unread-count";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return unreadCountResponse(defaultUnreadCountDeps());
}
