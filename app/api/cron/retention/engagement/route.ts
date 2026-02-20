import { extractCronSecret } from "@/lib/cron-auth";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { runEngagementRetentionCron } from "@/lib/cron-engagement-retention";
import { getRequestId } from "@/lib/request-id";
import { runOpsWatchdog } from "@/lib/ops-metrics";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const response = await runEngagementRetentionCron(extractCronSecret(req.headers), Object.fromEntries(req.nextUrl.searchParams.entries()), db as never, { requestId: getRequestId(req.headers), method: req.method });
  if (response.status < 500) await runOpsWatchdog({ mode: "alert" });
  return response;
}

export async function POST(req: NextRequest) {
  const response = await runEngagementRetentionCron(extractCronSecret(req.headers), Object.fromEntries(req.nextUrl.searchParams.entries()), db as never, { requestId: getRequestId(req.headers), method: req.method });
  if (response.status < 500) await runOpsWatchdog({ mode: "alert" });
  return response;
}
