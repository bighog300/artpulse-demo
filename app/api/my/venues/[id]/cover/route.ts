import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { handleSetVenueCover } from "@/lib/my-venue-images-route";

export const runtime = "nodejs";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return handleSetVenueCover(req, params, {
    requireAuth,
    requireVenueMembership: async (userId, venueId) => {
      const membership = await db.venueMembership.findUnique({ where: { userId_venueId: { userId, venueId } }, select: { id: true } });
      if (!membership) throw new Error("forbidden");
    },
    findVenueImageById: async (venueId, imageId) => db.venueImage.findFirst({
      where: { id: imageId, venueId },
      select: { id: true, url: true, assetId: true },
    }),
    updateVenueCover: async (venueId, payload) => db.venue.update({
      where: { id: venueId },
      data: payload,
      select: { featuredAssetId: true, featuredImageUrl: true },
    }),
  });
}
