import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withAdminRoute } from "@/lib/admin-route";

async function dbStatus() {
  try {
    await db.$queryRaw`SELECT 1`;
    return "ok" as const;
  } catch {
    return "fail" as const;
  }
}

export async function GET() {
  return withAdminRoute(async () => {
    const status = await dbStatus();

    return NextResponse.json({
      ok: true,
      db: status,
      buildTime: process.env.VERCEL_GIT_COMMIT_DATE ?? process.env.BUILD_TIME ?? null,
      gitSha: process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.GIT_SHA ?? null,
    });
  });
}
