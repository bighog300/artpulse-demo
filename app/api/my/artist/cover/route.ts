import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { handleSetArtistCover } from "@/lib/my-artist-images-route";

export const runtime = "nodejs";

export async function PATCH(req: NextRequest) {
  return handleSetArtistCover(req, {
    requireAuth,
    getOwnedArtistId: async (userId) => {
      const artist = await db.artist.findUnique({ where: { userId }, select: { id: true } });
      return artist?.id ?? null;
    },
    findArtistImageById: async (artistId, imageId) => db.artistImage.findFirst({
      where: { id: imageId, artistId },
      select: { id: true, url: true, assetId: true },
    }),
    updateArtistCover: async (artistId, payload) => db.artist.update({
      where: { id: artistId },
      data: payload,
      select: { featuredAssetId: true, featuredImageUrl: true },
    }),
  });
}
