import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiError } from "@/lib/api";
import { requireAuth } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await requireAuth();
    const items = await db.venueMembership.findMany({
      where: { userId: user.id },
      select: {
        role: true,
        venue: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            addressLine1: true,
            addressLine2: true,
            city: true,
            region: true,
            country: true,
            postcode: true,
            lat: true,
            lng: true,
            websiteUrl: true,
            instagramUrl: true,
            contactEmail: true,
            featuredImageUrl: true,
            featuredAssetId: true,
            isPublished: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(items.map((item) => ({ membershipRole: item.role, venue: item.venue })));
  } catch (error) {
    if (error instanceof Error && error.message === "unauthorized") {
      return apiError(401, "unauthorized", "Authentication required");
    }
    return apiError(500, "internal_error", "Unexpected server error");
  }
}
