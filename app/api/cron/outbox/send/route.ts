import { extractCronSecret } from "@/lib/cron-auth";
import { NextRequest } from "next/server";
import { sendPendingNotifications } from "@/lib/outbox";
import { runCronOutboxSend } from "@/lib/cron-outbox";
import { getRequestId } from "@/lib/request-id";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  return runCronOutboxSend(extractCronSecret(req.headers), sendPendingNotifications, {
    requestId: getRequestId(req.headers),
    method: req.method,
    dryRun: req.nextUrl.searchParams.get("dryRun"),
    lockStore: db,
  });
}

export async function POST(req: NextRequest) {
  return runCronOutboxSend(extractCronSecret(req.headers), sendPendingNotifications, {
    requestId: getRequestId(req.headers),
    method: req.method,
    dryRun: req.nextUrl.searchParams.get("dryRun"),
    lockStore: db,
  });
}
