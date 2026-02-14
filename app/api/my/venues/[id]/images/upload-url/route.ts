import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { handleVenueImageUploadUrl } from "@/lib/my-venue-images-route";

export const runtime = "nodejs";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return handleVenueImageUploadUrl(req, params, {
    requireAuth,
    requireVenueMembership: async (userId, venueId) => {
      const membership = await db.venueMembership.findUnique({ where: { userId_venueId: { userId, venueId } }, select: { id: true } });
      if (!membership) throw new Error("forbidden");
    },
  });
}
