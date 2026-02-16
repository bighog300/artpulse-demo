import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { runWeeklyDigests } from "@/lib/cron-digests";
import { getRequestId } from "@/lib/request-id";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  return runWeeklyDigests(req.headers.get("x-cron-secret"), db as never, { requestId: getRequestId(req.headers), method: req.method });
}

export async function POST(req: NextRequest) {
  return runWeeklyDigests(req.headers.get("x-cron-secret"), db as never, { requestId: getRequestId(req.headers), method: req.method });
}
