import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { handleArtistImageUpload } from "@/lib/my-artist-images-route";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  return handleArtistImageUpload(req, {
    requireAuth,
    getOwnedArtistId: async (userId) => {
      const artist = await db.artist.findUnique({ where: { userId }, select: { id: true } });
      return artist?.id ?? null;
    },
  });
}
