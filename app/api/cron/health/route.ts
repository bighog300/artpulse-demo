import { NextRequest, NextResponse } from "next/server";
import { extractCronSecret, validateCronRequest } from "@/lib/cron-auth";
import { db } from "@/lib/db";
import { getRequestId } from "@/lib/request-id";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function outboxBacklogCount() {
  if (!process.env.DATABASE_URL) return "unknown" as const;
  try {
    const count = await db.notificationOutbox.count({ where: { status: "PENDING", errorMessage: null } });
    return count;
  } catch {
    return "unknown" as const;
  }
}

export async function GET(req: NextRequest) {
  const authFailure = validateCronRequest(extractCronSecret(req.headers), {
    route: "/api/cron/health",
    requestId: getRequestId(req.headers),
    method: req.method,
  });
  if (authFailure) return authFailure;

  return NextResponse.json(
    {
      ok: true,
      lastRun: {
        outboxSend: "unknown",
        digestsWeekly: "unknown",
        retentionEngagement: "unknown",
      },
      backlog: {
        outboxPending: await outboxBacklogCount(),
      },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
