import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { parseBody, zodDetails } from "@/lib/validators";
import { createPerfSnapshot, explainRequestSchema } from "@/lib/perf/service";
import { getRequestId } from "@/lib/request-id";
import { captureException } from "@/lib/telemetry";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const requestId = getRequestId(req.headers);

  try {
    if (process.env.PERF_EXPLAIN_ENABLED !== "true") {
      return apiError(403, "feature_disabled", "Perf explain is disabled", undefined, requestId);
    }

    const parsedBody = explainRequestSchema.safeParse(await parseBody(req));
    if (!parsedBody.success) return apiError(400, "invalid_request", "Invalid payload", zodDetails(parsedBody.error), requestId);

    const result = await createPerfSnapshot(parsedBody.data);
    return NextResponse.json(result, { headers: { "cache-control": "private, no-store" } });
  } catch (error) {
    captureException(error, { route: "/api/admin/perf/explain", requestId });
    if (error instanceof Error && error.message === "unauthorized") {
      return apiError(401, "unauthorized", "Authentication required", undefined, requestId);
    }
    if (error instanceof Error && error.message === "forbidden") {
      return apiError(403, "forbidden", "Admin role required", undefined, requestId);
    }
    return apiError(500, "internal_error", "Unexpected server error", undefined, requestId);
  }
}
