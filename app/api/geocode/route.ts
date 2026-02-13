import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";
import { enforceRateLimit, isRateLimitError, principalRateLimitKey, rateLimitErrorResponse } from "@/lib/rate-limit";
import { geocodeQuerySchema, paramsToObject, zodDetails } from "@/lib/validators";

export const runtime = "nodejs";

type MapboxFeature = {
  place_name?: string;
  text?: string;
  center?: [number, number];
};

export async function GET(req: NextRequest) {
  const parsed = geocodeQuerySchema.safeParse(paramsToObject(req.nextUrl.searchParams));
  if (!parsed.success) return apiError(400, "invalid_request", "Invalid query parameters", zodDetails(parsed.error));

  const user = await getSessionUser().catch(() => null);

  try {
    await enforceRateLimit({
      key: principalRateLimitKey(req, "geocode", user?.id),
      limit: Number(process.env.RATE_LIMIT_GEOCODE_PER_MINUTE ?? 30),
      windowMs: 60_000,
    });
  } catch (error) {
    if (isRateLimitError(error)) return rateLimitErrorResponse(error);
    return apiError(500, "internal_error", "Unexpected server error");
  }

  const token = process.env.MAPBOX_ACCESS_TOKEN;
  if (!token) return NextResponse.json({ error: "not_configured" }, { status: 501 });

  const q = parsed.data.q;
  const url = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json`);
  url.searchParams.set("access_token", token);
  url.searchParams.set("limit", "5");
  url.searchParams.set("autocomplete", "true");

  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) return apiError(502, "provider_error", "Geocoding provider request failed");

  const json = (await response.json()) as { features?: MapboxFeature[] };
  const results = (json.features ?? [])
    .slice(0, 5)
    .map((feature) => {
      const [lng, lat] = feature.center ?? [];
      if (typeof lat !== "number" || typeof lng !== "number") return null;
      return {
        label: feature.place_name ?? feature.text ?? q,
        lat,
        lng,
      };
    })
    .filter((item): item is { label: string; lat: number; lng: number } => item !== null);

  return NextResponse.json({ results });
}
