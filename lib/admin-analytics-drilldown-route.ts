import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { adminAnalyticsDrilldownQuerySchema, adminAnalyticsTopTargetsQuerySchema, zodDetails } from "@/lib/validators";
import { getDrilldown, getTopTargets, type AdminDrilldownDb } from "@/lib/admin-analytics-drilldown";

type Deps = {
  requireAdminUser: () => Promise<unknown>;
  analyticsDb: AdminDrilldownDb;
};

function parseQuery(req: NextRequest) {
  return Object.fromEntries(req.nextUrl.searchParams.entries());
}

export async function handleAdminAnalyticsDrilldown(req: NextRequest, deps: Deps) {
  try {
    await deps.requireAdminUser();
    const parsed = adminAnalyticsDrilldownQuerySchema.safeParse(parseQuery(req));
    if (!parsed.success) return apiError(400, "invalid_request", "Invalid query params", zodDetails(parsed.error));

    const payload = await getDrilldown(parsed.data.days, parsed.data.targetType, parsed.data.targetId, deps.analyticsDb);
    return NextResponse.json(payload);
  } catch (error) {
    if (error instanceof Error && error.message === "unauthorized") return apiError(401, "unauthorized", "Authentication required");
    if (error instanceof Error && error.message === "forbidden") return apiError(403, "forbidden", "Admin role required");
    return apiError(500, "internal_error", "Unexpected server error");
  }
}

export async function handleAdminAnalyticsTopTargets(req: NextRequest, deps: Deps) {
  try {
    await deps.requireAdminUser();
    const parsed = adminAnalyticsTopTargetsQuerySchema.safeParse(parseQuery(req));
    if (!parsed.success) return apiError(400, "invalid_request", "Invalid query params", zodDetails(parsed.error));

    const payload = await getTopTargets(parsed.data.days, parsed.data.targetType, parsed.data.metric, parsed.data.limit, deps.analyticsDb);
    return NextResponse.json(payload);
  } catch (error) {
    if (error instanceof Error && error.message === "unauthorized") return apiError(401, "unauthorized", "Authentication required");
    if (error instanceof Error && error.message === "forbidden") return apiError(403, "forbidden", "Admin role required");
    return apiError(500, "internal_error", "Unexpected server error");
  }
}
