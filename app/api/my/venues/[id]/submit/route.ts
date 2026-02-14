import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { handleVenueSubmit } from "@/lib/my-venue-submit-route";

export const runtime = "nodejs";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return handleVenueSubmit(req, params, {
    requireAuth,
    requireVenueMembership: async (userId, venueId) => {
      const membership = await db.venueMembership.findUnique({ where: { userId_venueId: { userId, venueId } }, select: { id: true } });
      if (!membership) throw new Error("forbidden");
    },
    findVenueForSubmit: async (venueId) => db.venue.findUnique({
      where: { id: venueId },
      select: {
        id: true,
        name: true,
        description: true,
        featuredAssetId: true,
        featuredImageUrl: true,
        addressLine1: true,
        city: true,
        country: true,
        websiteUrl: true,
        images: { select: { id: true }, take: 1 },
      },
    }),
    setVenuePublishedDraft: async (venueId) => {
      await db.venue.update({ where: { id: venueId }, data: { isPublished: false } });
    },
    upsertSubmission: async ({ venueId, userId, message }) => db.submission.upsert({
      where: { targetVenueId: venueId },
      create: {
        type: "VENUE",
        status: "SUBMITTED",
        submitterUserId: userId,
        venueId,
        targetVenueId: venueId,
        note: message ?? null,
        submittedAt: new Date(),
      },
      update: {
        status: "SUBMITTED",
        submitterUserId: userId,
        note: message ?? null,
        decisionReason: null,
        submittedAt: new Date(),
        decidedAt: null,
        decidedByUserId: null,
      },
      select: { id: true, status: true, createdAt: true, submittedAt: true },
    }),
  });
}
