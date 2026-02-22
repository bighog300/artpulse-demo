import { NextRequest } from "next/server";
import { extractCronSecret } from "@/lib/cron-auth";
import { db } from "@/lib/db";
import { getRequestId } from "@/lib/request-id";
import { runEditorialNotificationsCron } from "@/lib/cron-editorial-notifications";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  return runEditorialNotificationsCron(
    extractCronSecret(req.headers),
    req.nextUrl.searchParams.get("dryRun"),
    db as never,
    { requestId: getRequestId(req.headers), method: req.method, req },
  );
}

export async function POST(req: NextRequest) {
  return runEditorialNotificationsCron(
    extractCronSecret(req.headers),
    req.nextUrl.searchParams.get("dryRun"),
    db as never,
    { requestId: getRequestId(req.headers), method: req.method, req },
  );
}
