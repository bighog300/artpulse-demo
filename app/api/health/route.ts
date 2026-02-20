import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const startTimeMs = Date.now();

async function probeDb() {
  if (!process.env.DATABASE_URL) return "unknown" as const;
  try {
    await Promise.race([
      db.$queryRaw`SELECT 1`,
      new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 250)),
    ]);
    return "ok" as const;
  } catch {
    return "unknown" as const;
  }
}

export async function GET() {
  const payload = {
    ok: true,
    gitSha: process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.BUILD_SHA,
    buildTimeISO: process.env.VERCEL_GIT_COMMIT_TIMESTAMP ?? process.env.BUILD_TIME_ISO,
    uptimeSeconds: Math.floor((Date.now() - startTimeMs) / 1000),
    db: await probeDb(),
  };

  return NextResponse.json(payload, { headers: { "Cache-Control": "no-store" } });
}
