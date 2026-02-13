import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { parseBody, zodDetails } from "@/lib/validators";
import { createPerfSnapshot, explainRequestSchema } from "@/lib/perf/service";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const parsedBody = explainRequestSchema.safeParse(await parseBody(req));
    if (!parsedBody.success) return apiError(400, "invalid_request", "Invalid payload", zodDetails(parsedBody.error));

    const result = await createPerfSnapshot(parsedBody.data);
    return NextResponse.json(result);
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
