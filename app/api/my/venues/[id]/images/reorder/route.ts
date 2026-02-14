import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { handleReorderVenueImages } from "@/lib/my-venue-images-route";

export const runtime = "nodejs";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return handleReorderVenueImages(req, params, {
    requireAuth,
    requireVenueMembership: async (userId, venueId) => {
      const membership = await db.venueMembership.findUnique({ where: { userId_venueId: { userId, venueId } }, select: { id: true } });
      if (!membership) throw new Error("forbidden");
    },
    findVenueImageIds: async (venueId, imageIds) => {
      const rows = await db.venueImage.findMany({ where: { venueId, id: { in: imageIds } }, select: { id: true } });
      return rows.map((row) => row.id);
    },
    reorderVenueImages: async (_venueId, orderedIds) => {
      await db.$transaction(orderedIds.map((id, index) => db.venueImage.update({ where: { id }, data: { sortOrder: index } })));
    },
  });
}
