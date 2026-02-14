import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { handleCreateArtistImage } from "@/lib/my-artist-images-route";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  return handleCreateArtistImage(req, {
    requireAuth,
    getOwnedArtistId: async (userId) => {
      const artist = await db.artist.findUnique({ where: { userId }, select: { id: true } });
      return artist?.id ?? null;
    },
    findMaxSortOrder: async (artistId) => {
      const row = await db.artistImage.findFirst({ where: { artistId }, orderBy: { sortOrder: "desc" }, select: { sortOrder: true } });
      return row?.sortOrder ?? null;
    },
    createArtistImage: async (input) => db.artistImage.create({
      data: input,
      select: { id: true, artistId: true, url: true, alt: true, sortOrder: true, assetId: true, createdAt: true },
    }),
  });
}
