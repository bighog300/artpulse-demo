import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { handleAdminAnalyticsDrilldown } from "@/lib/admin-analytics-drilldown-route";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  return handleAdminAnalyticsDrilldown(req, { requireAdminUser: requireAdmin, analyticsDb: db as never });
}
