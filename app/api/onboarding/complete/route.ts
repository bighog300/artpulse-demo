import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { markOnboardingCompleted } from "@/lib/onboarding";

export const runtime = "nodejs";

export async function POST() {
  try {
    const user = await requireAuth();
    await markOnboardingCompleted(user.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "unauthorized") {
      return apiError(401, "unauthorized", "Authentication required");
    }
    return apiError(500, "internal_error", "Unexpected server error");
  }
}
