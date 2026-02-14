import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { handleDeleteVenueImage, handlePatchVenueImage, venueImageBlobDelete } from "@/lib/my-venue-images-route";

export const runtime = "nodejs";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ imageId: string }> }) {
  return handlePatchVenueImage(req, params, {
    requireAuth,
    findVenueImageForUser: async (imageId, userId) => db.venueImage.findFirst({
      where: { id: imageId, venue: { memberships: { some: { userId } } } },
      select: { id: true, venueId: true, url: true, alt: true, sortOrder: true, createdAt: true },
    }),
    updateVenueImageAlt: async (imageId, alt) => db.venueImage.update({
      where: { id: imageId },
      data: { alt },
      select: { id: true, venueId: true, url: true, alt: true, sortOrder: true, createdAt: true },
    }),
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ imageId: string }> }) {
  return handleDeleteVenueImage(req, params, {
    requireAuth,
    findVenueImageForUser: async (imageId, userId) => db.venueImage.findFirst({
      where: { id: imageId, venue: { memberships: { some: { userId } } } },
      select: { id: true, venueId: true, url: true, alt: true, sortOrder: true, createdAt: true },
    }),
    deleteVenueImage: async (imageId) => db.venueImage.delete({
      where: { id: imageId },
      select: { id: true, venueId: true, url: true, alt: true, sortOrder: true, createdAt: true },
    }),
    deleteBlobByUrl: venueImageBlobDelete,
  });
}
