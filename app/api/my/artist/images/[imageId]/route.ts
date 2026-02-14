import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { artistImageBlobDelete, handleDeleteArtistImage, handlePatchArtistImage } from "@/lib/my-artist-images-route";

export const runtime = "nodejs";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ imageId: string }> }) {
  return handlePatchArtistImage(req, params, {
    requireAuth,
    findArtistImageByOwner: async (imageId, userId) => db.artistImage.findFirst({
      where: { id: imageId, artist: { userId } },
      select: { id: true, artistId: true, url: true, alt: true, sortOrder: true, assetId: true, createdAt: true },
    }),
    updateArtistImageAlt: async (imageId, alt) => db.artistImage.update({
      where: { id: imageId },
      data: { alt },
      select: { id: true, artistId: true, url: true, alt: true, sortOrder: true, assetId: true, createdAt: true },
    }),
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ imageId: string }> }) {
  return handleDeleteArtistImage(req, params, {
    requireAuth,
    findArtistImageByOwner: async (imageId, userId) => db.artistImage.findFirst({
      where: { id: imageId, artist: { userId } },
      select: { id: true, artistId: true, url: true, alt: true, sortOrder: true, assetId: true, createdAt: true },
    }),
    deleteArtistImage: async (imageId) => db.artistImage.delete({
      where: { id: imageId },
      select: { id: true, artistId: true, url: true, alt: true, sortOrder: true, assetId: true, createdAt: true },
    }),
    deleteBlobByUrl: artistImageBlobDelete,
  });
}
