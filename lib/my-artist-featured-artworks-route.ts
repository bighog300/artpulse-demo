import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import type { AdminAuditInput } from "@/lib/admin-audit";
import { artistFeaturedArtworksReplaceSchema, parseBody, zodDetails } from "@/lib/validators";

type SessionUser = { id: string; email: string };

type FeaturedArtworkRecord = {
  artwork: {
    id: string;
    slug: string | null;
    title: string;
    featuredAsset: { url: string | null } | null;
    images: Array<{ asset: { url: string | null } | null }>;
  };
  sortOrder: number;
};

type Deps = {
  requireAuth: () => Promise<SessionUser>;
  findOwnedArtistByUserId: (userId: string) => Promise<{ id: string } | null>;
  listFeatured: (artistId: string) => Promise<FeaturedArtworkRecord[]>;
  findPublishedOwnedArtworkIds: (artistId: string, artworkIds: string[]) => Promise<string[]>;
  replaceFeatured: (artistId: string, artworkIds: string[]) => Promise<void>;
  logAdminAction: (input: AdminAuditInput) => Promise<void>;
};

function mapFeatured(records: FeaturedArtworkRecord[]) {
  return records.map((row) => ({
    id: row.artwork.id,
    slug: row.artwork.slug,
    title: row.artwork.title,
    coverUrl: row.artwork.featuredAsset?.url ?? row.artwork.images[0]?.asset?.url ?? null,
    sortOrder: row.sortOrder,
  }));
}

export async function handleGetMyArtistFeaturedArtworks(req: NextRequest, deps: Deps) {
  try {
    const user = await deps.requireAuth();
    const artist = await deps.findOwnedArtistByUserId(user.id);
    if (!artist) return apiError(403, "forbidden", "Artist profile required");
    const records = await deps.listFeatured(artist.id);
    return NextResponse.json({ artworks: mapFeatured(records) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof Error && error.message === "unauthorized") return apiError(401, "unauthorized", "Authentication required");
    return apiError(500, "internal_error", "Unexpected server error");
  }
}

export async function handlePutMyArtistFeaturedArtworks(req: NextRequest, deps: Deps) {
  try {
    const user = await deps.requireAuth();
    const artist = await deps.findOwnedArtistByUserId(user.id);
    if (!artist) return apiError(403, "forbidden", "Artist profile required");

    const parsed = artistFeaturedArtworksReplaceSchema.safeParse(await parseBody(req));
    if (!parsed.success) return apiError(400, "invalid_request", "Invalid payload", zodDetails(parsed.error));

    const nextArtworkIds = parsed.data.artworkIds;
    const uniqueIds = Array.from(new Set(nextArtworkIds));
    if (uniqueIds.length !== nextArtworkIds.length) return apiError(400, "invalid_request", "artworkIds must be unique");

    const allowedIds = await deps.findPublishedOwnedArtworkIds(artist.id, uniqueIds);
    if (allowedIds.length !== uniqueIds.length) return apiError(400, "invalid_request", "All featured artworks must be published and owned by your artist profile");

    const before = await deps.listFeatured(artist.id);
    await deps.replaceFeatured(artist.id, uniqueIds);
    const after = await deps.listFeatured(artist.id);

    await deps.logAdminAction({
      actorEmail: user.email,
      action: "ARTIST_FEATURED_ARTWORKS_UPDATED",
      targetType: "artist",
      targetId: artist.id,
      metadata: {
        beforeArtworkIds: before.map((row) => row.artwork.id),
        afterArtworkIds: after.map((row) => row.artwork.id),
      },
      req,
    });

    return NextResponse.json({ artworks: mapFeatured(after) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof Error && error.message === "unauthorized") return apiError(401, "unauthorized", "Authentication required");
    return apiError(500, "internal_error", "Unexpected server error");
  }
}
