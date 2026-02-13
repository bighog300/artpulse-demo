import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiError } from "@/lib/api";
import { parseBody, zodDetails } from "@/lib/validators";
import { previewSavedSearch, savedSearchParamsSchema } from "@/lib/saved-searches";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await parseBody(req);
  const parsed = savedSearchParamsSchema.safeParse(body);
  if (!parsed.success) return apiError(400, "invalid_request", "Invalid preview payload", zodDetails(parsed.error));

  const result = await previewSavedSearch({ eventDb: db as never, body: parsed.data });
  return NextResponse.json(result);
}
