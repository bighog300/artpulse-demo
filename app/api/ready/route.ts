import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { captureException } from "@/lib/telemetry";

export const runtime = "nodejs";

const READINESS_TIMEOUT_MS = 2_000;

export async function GET() {
  try {
    await Promise.race([
      db.$queryRaw`SELECT 1`,
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error("readiness_timeout")), READINESS_TIMEOUT_MS);
      }),
    ]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const errorCode = error instanceof Error ? error.message : "readiness_failed";
    captureException(error, { route: "/api/ready" });
    return NextResponse.json({ ok: false, errorCode }, { status: 503 });
  }
}
