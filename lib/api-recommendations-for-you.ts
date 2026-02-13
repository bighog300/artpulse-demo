import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiError } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { forYouRecommendationsQuerySchema, paramsToObject, zodDetails } from "@/lib/validators";
import { getForYouRecommendations } from "@/lib/recommendations-for-you";

export async function handleForYouGet(req: { nextUrl: URL }, deps: {
  requireAuthFn?: typeof requireAuth;
  getForYouRecommendationsFn?: typeof getForYouRecommendations;
} = {}) {
  try {
    const user = await (deps.requireAuthFn ?? requireAuth)();
    const parsed = forYouRecommendationsQuerySchema.safeParse(paramsToObject(req.nextUrl.searchParams));
    if (!parsed.success) return apiError(400, "invalid_request", "Invalid query parameters", zodDetails(parsed.error));

    const result = await (deps.getForYouRecommendationsFn ?? getForYouRecommendations)(db, {
      userId: user.id,
      days: parsed.data.days,
      limit: parsed.data.limit,
    });

    return NextResponse.json({ windowDays: result.windowDays, items: result.items });
  } catch {
    return apiError(401, "unauthorized", "Login required");
  }
}
