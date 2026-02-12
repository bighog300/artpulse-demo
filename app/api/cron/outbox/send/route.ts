import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { sendPendingNotifications } from "@/lib/outbox";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const configuredSecret = process.env.CRON_SECRET;
  if (!configuredSecret) {
    return apiError(500, "misconfigured", "CRON_SECRET is not configured");
  }

  const headerSecret = req.headers.get("x-cron-secret");
  if (headerSecret !== configuredSecret) {
    return apiError(401, "unauthorized", "Invalid cron secret");
  }

  const result = await sendPendingNotifications({ limit: 25 });
  return NextResponse.json(result);
}
