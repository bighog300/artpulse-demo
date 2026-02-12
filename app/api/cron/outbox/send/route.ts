import { NextRequest } from "next/server";
import { sendPendingNotifications } from "@/lib/outbox";
import { runCronOutboxSend } from "@/lib/cron-outbox";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  return runCronOutboxSend(req.headers.get("x-cron-secret"), sendPendingNotifications);
}

export async function POST(req: NextRequest) {
  return runCronOutboxSend(req.headers.get("x-cron-secret"), sendPendingNotifications);
}
