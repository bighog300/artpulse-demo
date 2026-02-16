import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    ok: true,
    timestamp: new Date().toISOString(),
    buildSha: process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.BUILD_SHA,
    env: process.env.NODE_ENV ?? "unknown",
  });
}
