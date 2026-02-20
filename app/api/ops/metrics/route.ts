import { NextRequest, NextResponse } from "next/server";
import { getOpsMetricsSnapshot } from "@/lib/ops-metrics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(req: NextRequest) {
  const opsSecret = process.env.OPS_SECRET;
  if (!opsSecret) return false;
  const bearer = req.headers.get("authorization") ?? "";
  return bearer === `Bearer ${opsSecret}`;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: { code: "unauthorized", message: "Unauthorized" } }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }

  const metrics = await getOpsMetricsSnapshot();
  return NextResponse.json(metrics, { headers: { "Cache-Control": "no-store" } });
}
