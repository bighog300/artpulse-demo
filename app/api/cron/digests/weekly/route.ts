import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { runWeeklyDigests } from "@/lib/cron-digests";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  return runWeeklyDigests(req.headers.get("x-cron-secret"), db as never);
}

export async function POST(req: NextRequest) {
  return runWeeklyDigests(req.headers.get("x-cron-secret"), db as never);
}
