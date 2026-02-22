import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiError } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { setOnboardingFlagForSession } from "@/lib/onboarding";
import { handlePostMyVenue } from "@/lib/my-venue-create-route";
import { logAdminAction } from "@/lib/admin-audit";

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
  return handlePostMyVenue(req, {
    requireAuth,
    findExistingManagedVenue: async ({ userId, createKey }) => {
      const normalize = (value?: string | null) => (value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
      const memberships = await db.venueMembership.findMany({
        where: { userId, role: "OWNER" },
        orderBy: { createdAt: "desc" },
        select: { venue: { select: { id: true, slug: true, name: true, city: true, country: true, isPublished: true } } },
      });

      const matched = memberships.find(({ venue }) => [
        normalize(venue.name),
        normalize(venue.city),
        normalize(venue.country),
      ].join("|") === createKey);

      if (matched) return { id: matched.venue.id, slug: matched.venue.slug, name: matched.venue.name, isPublished: matched.venue.isPublished };

      const fallback = memberships[0]?.venue;
      return fallback ? { id: fallback.id, slug: fallback.slug, name: fallback.name, isPublished: fallback.isPublished } : null;
    },
    findVenueBySlug: async (slug) => db.venue.findUnique({ where: { slug }, select: { id: true } }),
    createVenue: async (data) => db.venue.create({
      data: {
        name: data.name,
        slug: data.slug,
        city: data.city ?? null,
        country: data.country ?? null,
        websiteUrl: data.websiteUrl ?? null,
        featuredAssetId: null,
        isPublished: false,
      },
      select: { id: true, slug: true, name: true, isPublished: true },
    }),
    ensureOwnerMembership: async (venueId, userId) => {
      await db.venueMembership.upsert({
        where: { userId_venueId: { userId, venueId } },
        create: { userId, venueId, role: "OWNER" },
        update: { role: "OWNER" },
      });
    },
    upsertVenueDraftSubmission: async (venueId, userId) => {
      const current = await db.submission.findUnique({ where: { targetVenueId: venueId }, select: { id: true, status: true } });

      if (current) {
        await db.submission.update({
          where: { id: current.id },
          data: {
            status: current.status === "APPROVED" ? current.status : "DRAFT",
            submitterUserId: userId,
            type: "VENUE",
            kind: "PUBLISH",
            decidedAt: current.status === "APPROVED" ? undefined : null,
            decidedByUserId: current.status === "APPROVED" ? undefined : null,
            decisionReason: current.status === "APPROVED" ? undefined : null,
            submittedAt: null,
          },
        });
        return;
      }

      await db.submission.create({
        data: {
          type: "VENUE",
          kind: "PUBLISH",
          status: "DRAFT",
          submitterUserId: userId,
          venueId,
          targetVenueId: venueId,
        },
      });
    },
    setOnboardingFlag: async (user) => {
      await setOnboardingFlagForSession(user, "hasCreatedVenue", true, { path: "/api/my/venues" });
    },
    logAudit: async ({ action, user, venue, reused, createKey, req: request }) => {
      await logAdminAction({
        actorEmail: user.email ?? "unknown@local",
        action,
        targetType: "venue",
        targetId: venue.id,
        metadata: { userId: user.id, venueId: venue.id, slug: venue.slug, reused, createKey },
        req: request,
      });
    },
  });
}
