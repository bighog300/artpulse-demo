import { unstable_noStore as noStore } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { db } from "@/lib/db";
import { verifyVenueClaim } from "@/lib/venue-claims/service";

export const runtime = "nodejs";

export async function GET(req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  noStore();
  try {
    const { slug } = await ctx.params;
    const token = req.nextUrl.searchParams.get("token")?.trim();
    if (!token) return apiError(400, "invalid_request", "token is required");

    const result = await verifyVenueClaim({ db: db as never, slug, token });
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof Error && error.message === "not_found") return apiError(404, "not_found", "Venue not found");
    if (error instanceof Error && error.message === "invalid_token") return apiError(400, "invalid_token", "Token is invalid or expired");
    return apiError(500, "internal_error", "Unexpected server error");
  }
}
