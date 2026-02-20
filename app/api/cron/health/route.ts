import { NextRequest, NextResponse } from "next/server";
import { extractCronSecret, validateCronRequest } from "@/lib/cron-auth";
import { getRequestId } from "@/lib/request-id";
import { runOpsWatchdog } from "@/lib/ops-metrics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const requestId = getRequestId(req.headers);
  const authFailure = validateCronRequest(extractCronSecret(req.headers), {
    route: "/api/cron/health",
    requestId,
    method: req.method,
  });
  if (authFailure) return authFailure;

  const watchdog = await runOpsWatchdog({ mode: "snapshot" });
  return NextResponse.json(
    {
      ok: true,
      requestId,
      cron: watchdog.cron,
      backlog: {
        outboxPending: watchdog.backlog,
      },
      stallThresholdHours: watchdog.stallThresholdHours,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
