import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiError } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { myVenueCreateSchema, parseBody, zodDetails } from "@/lib/validators";
import { setOnboardingFlag } from "@/lib/onboarding";
import { ensureUniqueVenueSlugWithDeps, slugifyVenueName } from "@/lib/venue-slug";

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

export async function POST(req: NextRequest) {
  let user;
  try {
    user = await requireAuth();
  } catch {
    return apiError(401, "unauthorized", "Authentication required");
  }

  try {
    const parsedBody = myVenueCreateSchema.safeParse(await parseBody(req));
    if (!parsedBody.success) return apiError(400, "invalid_request", "Invalid payload", zodDetails(parsedBody.error));

    const data = parsedBody.data;
    const baseSlug = data.slug ?? slugifyVenueName(data.name);
    const slug = await ensureUniqueVenueSlugWithDeps(
      {
        findBySlug: (candidate) => db.venue.findUnique({ where: { slug: candidate }, select: { id: true } }),
      },
      baseSlug,
    );

    const venue = await db.venue.create({
      data: {
        name: data.name,
        slug,
        description: data.description ?? null,
        addressLine1: data.address ?? null,
        websiteUrl: data.website ?? null,
        lat: data.lat ?? null,
        lng: data.lng ?? null,
        isPublished: false,
      },
      select: { id: true, slug: true },
    });

    await db.venueMembership.create({
      data: {
        userId: user.id,
        venueId: venue.id,
        role: "OWNER",
      },
    });

    await db.submission.upsert({
      where: { targetVenueId: venue.id },
      create: {
        type: "VENUE",
        status: "DRAFT",
        submitterUserId: user.id,
        venueId: venue.id,
        targetVenueId: venue.id,
      },
      update: {
        status: "DRAFT",
        submitterUserId: user.id,
      },
    });

    await setOnboardingFlag(user.id, "hasCreatedVenue");

    return NextResponse.json({ ok: true, venueId: venue.id, slug: venue.slug });
  } catch {
    return apiError(500, "internal_error", "Unexpected server error");
  }
}
