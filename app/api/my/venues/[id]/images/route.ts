import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { handleCreateVenueImage } from "@/lib/my-venue-images-route";

export const runtime = "nodejs";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return handleCreateVenueImage(req, params, {
    requireAuth,
    requireVenueMembership: async (userId, venueId) => {
      const membership = await db.venueMembership.findUnique({ where: { userId_venueId: { userId, venueId } }, select: { id: true } });
      if (!membership) throw new Error("forbidden");
    },
    findMaxSortOrder: async (venueId) => {
      const row = await db.venueImage.findFirst({ where: { venueId }, orderBy: { sortOrder: "desc" }, select: { sortOrder: true } });
      return row?.sortOrder ?? null;
    },
    createVenueImage: async (input) => db.venueImage.create({
      data: input,
      select: { id: true, venueId: true, url: true, alt: true, sortOrder: true, createdAt: true },
    }),
  });
}
