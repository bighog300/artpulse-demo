import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { computeChecklist, getOnboardingState } from "@/lib/onboarding";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await requireAuth();
    const [state, membership] = await Promise.all([
      getOnboardingState(user.id),
      db.venueMembership.findFirst({ where: { userId: user.id }, select: { venueId: true } }),
    ]);

    return NextResponse.json({
      state,
      checklist: computeChecklist(state, { hasVenueMembership: Boolean(membership) }),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "unauthorized") {
      return apiError(401, "unauthorized", "Authentication required");
    }
    return apiError(401, "unauthorized", "Authentication required");
  }
}
