import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { handleReorderArtistImages } from "@/lib/my-artist-images-route";

export const runtime = "nodejs";

export async function PATCH(req: NextRequest) {
  return handleReorderArtistImages(req, {
    requireAuth,
    getOwnedArtistId: async (userId) => {
      const artist = await db.artist.findUnique({ where: { userId }, select: { id: true } });
      return artist?.id ?? null;
    },
    findArtistImageIds: async (artistId, imageIds) => {
      const rows = await db.artistImage.findMany({ where: { artistId, id: { in: imageIds } }, select: { id: true } });
      return rows.map((row) => row.id);
    },
    reorderArtistImages: async (_artistId, orderedIds) => {
      await db.$transaction(orderedIds.map((id, index) => db.artistImage.update({ where: { id }, data: { sortOrder: index } })));
    },
  });
}
