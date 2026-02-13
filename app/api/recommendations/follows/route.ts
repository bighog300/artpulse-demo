import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { apiError } from "@/lib/api";
import { getFollowRecommendations } from "@/lib/recommendations-follows";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const rawLimit = req.nextUrl.searchParams.get("limit");
  const parsedLimit = rawLimit ? Number.parseInt(rawLimit, 10) : 12;

  if (Number.isNaN(parsedLimit) || parsedLimit <= 0) {
    return apiError(400, "invalid_request", "limit must be a positive integer");
  }

  const user = await getSessionUser();
  const data = await getFollowRecommendations({ userId: user?.id, limit: parsedLimit });

  return NextResponse.json(data);
}
