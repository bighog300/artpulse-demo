import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { runEngagementRetentionCron } from "@/lib/cron-engagement-retention";
import { getRequestId } from "@/lib/request-id";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  return runEngagementRetentionCron(req.headers.get("x-cron-secret"), Object.fromEntries(req.nextUrl.searchParams.entries()), db as never, { requestId: getRequestId(req.headers), method: req.method });
}

export async function POST(req: NextRequest) {
  return runEngagementRetentionCron(req.headers.get("x-cron-secret"), Object.fromEntries(req.nextUrl.searchParams.entries()), db as never, { requestId: getRequestId(req.headers), method: req.method });
}
