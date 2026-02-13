import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { runEngagementRetentionCron } from "@/lib/cron-engagement-retention";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  return runEngagementRetentionCron(req.headers.get("x-cron-secret"), Object.fromEntries(req.nextUrl.searchParams.entries()), db as never);
}

export async function POST(req: NextRequest) {
  return runEngagementRetentionCron(req.headers.get("x-cron-secret"), Object.fromEntries(req.nextUrl.searchParams.entries()), db as never);
}
