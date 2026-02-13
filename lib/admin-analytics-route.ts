import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { analyticsWindowQuerySchema } from "@/lib/validators";
import { getAdminAnalyticsOverview, type AdminAnalyticsDb } from "@/lib/admin-analytics";

type OverviewDeps = {
  requireAdminUser: () => Promise<unknown>;
  analyticsDb: AdminAnalyticsDb;
};

export async function handleAdminAnalyticsOverview(req: NextRequest, deps: OverviewDeps) {
  try {
    await deps.requireAdminUser();
    const parsedQuery = analyticsWindowQuerySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams.entries()));
    if (!parsedQuery.success) {
      return apiError(400, "invalid_request", "Invalid query params", parsedQuery.error.flatten());
    }

    const payload = await getAdminAnalyticsOverview(parsedQuery.data.days, deps.analyticsDb);
    return NextResponse.json(payload);
  } catch (error) {
    if (error instanceof Error && error.message === "unauthorized") {
      return apiError(401, "unauthorized", "Authentication required");
    }
    if (error instanceof Error && error.message === "forbidden") {
      return apiError(403, "forbidden", "Admin role required");
    }
    return apiError(500, "internal_error", "Unexpected server error");
  }
}
