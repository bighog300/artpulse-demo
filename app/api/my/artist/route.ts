import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { handlePatchMyArtist } from "@/lib/my-artist-route";

export const runtime = "nodejs";

export async function PATCH(req: NextRequest) {
  return handlePatchMyArtist(req, {
    requireAuth,
    findOwnedArtistByUserId: async (userId) => db.artist.findUnique({
      where: { userId },
      select: { id: true, name: true, bio: true, websiteUrl: true, instagramUrl: true, avatarImageUrl: true, featuredAssetId: true },
    }),
    updateArtistById: async (artistId, patch) => db.artist.update({
      where: { id: artistId },
      data: patch,
      select: { id: true, name: true, bio: true, websiteUrl: true, instagramUrl: true, avatarImageUrl: true, featuredAssetId: true },
    }),
  });
}
