import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import type { AdminAuditInput } from "@/lib/admin-audit";
import { computeArtworkCompleteness } from "@/lib/artwork-completeness";

type SessionUser = { email: string };

type ArtworkPublishRecord = {
  id: string;
  title: string;
  description: string | null;
  year: number | null;
  medium: string | null;
  featuredAssetId: string | null;
  isPublished: boolean;
};

type Deps = {
  requireMyArtworkAccess: (artworkId: string) => Promise<{ user: SessionUser }>;
  findArtworkById: (artworkId: string) => Promise<ArtworkPublishRecord | null>;
  countArtworkImages: (artworkId: string) => Promise<number>;
  findFirstArtworkImageAssetId: (artworkId: string) => Promise<string | null>;
  updateArtworkPublishState: (artworkId: string, input: { isPublished: boolean; featuredAssetId?: string }) => Promise<ArtworkPublishRecord>;
  logAdminAction: (input: AdminAuditInput) => Promise<void>;
};

export async function handlePatchArtworkPublish(req: NextRequest, input: { artworkId: string; isPublished: boolean }, deps: Deps) {
  try {
    const { user } = await deps.requireMyArtworkAccess(input.artworkId);

    if (!input.isPublished) {
      const artwork = await deps.updateArtworkPublishState(input.artworkId, { isPublished: false });
      await deps.logAdminAction({ actorEmail: user.email, action: "ARTWORK_PUBLISH_TOGGLED", targetType: "artwork", targetId: artwork.id, metadata: { isPublished: artwork.isPublished }, req });
      return NextResponse.json({ artwork });
    }

    const artwork = await deps.findArtworkById(input.artworkId);
    if (!artwork) return apiError(404, "not_found", "Artwork not found");

    const imageCount = await deps.countArtworkImages(input.artworkId);
    const completeness = computeArtworkCompleteness(artwork, imageCount);

    if (!completeness.required.ok) {
      return NextResponse.json({
        error: "ARTWORK_NOT_PUBLISHABLE",
        message: "Artwork is missing required fields to publish.",
        requiredIssues: completeness.required.issues,
      }, { status: 409 });
    }

    let featuredAssetId = artwork.featuredAssetId;
    if (!featuredAssetId && imageCount > 0) {
      featuredAssetId = await deps.findFirstArtworkImageAssetId(input.artworkId);
    }

    const updated = await deps.updateArtworkPublishState(input.artworkId, {
      isPublished: true,
      ...(featuredAssetId ? { featuredAssetId } : {}),
    });

    await deps.logAdminAction({ actorEmail: user.email, action: "ARTWORK_PUBLISH_TOGGLED", targetType: "artwork", targetId: updated.id, metadata: { isPublished: updated.isPublished }, req });
    return NextResponse.json({ artwork: updated });
  } catch (error) {
    if (error instanceof Error && error.message === "unauthorized") return apiError(401, "unauthorized", "Authentication required");
    if (error instanceof Error && (error.message === "forbidden" || error.message === "not_found")) return apiError(403, "forbidden", "Forbidden");
    return apiError(500, "internal_error", "Unexpected server error");
  }
}
