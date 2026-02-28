import { unstable_noStore as noStore } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { requireAdmin, isAuthError } from "@/lib/auth";
import { db } from "@/lib/db";
import { createOpenAIResponsesClient, runVenueGenerationPipeline } from "@/lib/venue-generation/generation-pipeline";
import { venueGenerationInputSchema } from "@/lib/venue-generation/schemas";
import { parseBody, zodDetails } from "@/lib/validators";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  noStore();
  try {
    const admin = await requireAdmin();
    const parsed = venueGenerationInputSchema.safeParse(await parseBody(req));
    if (!parsed.success) return apiError(400, "invalid_request", "Invalid payload", zodDetails(parsed.error));

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return apiError(500, "misconfigured", "OPENAI_API_KEY is required");

    const openai = await createOpenAIResponsesClient({ apiKey });
    const result = await runVenueGenerationPipeline({
      input: parsed.data,
      triggeredById: admin.id,
      db,
      openai,
    });

    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (isAuthError(error)) return apiError(401, "unauthorized", "Authentication required");
    if (error instanceof Error && error.message === "forbidden") return apiError(403, "forbidden", "Forbidden");
    return apiError(500, "internal_error", "Unexpected server error");
  }
}
