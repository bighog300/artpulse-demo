import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { computeArtworkAnalytics, type ArtworkAnalyticsInputArtwork, type ArtworkAnalyticsInputDailyRow } from "@/lib/artwork-analytics";

type SessionUser = { id: string };

type Deps = {
  requireAuth: () => Promise<SessionUser>;
  findOwnedArtistByUserId: (userId: string) => Promise<{ id: string } | null>;
  listArtworksByArtistId: (artistId: string) => Promise<ArtworkAnalyticsInputArtwork[]>;
  listArtworkViewDailyRows: (artworkIds: string[], start: Date) => Promise<ArtworkAnalyticsInputDailyRow[]>;
};

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

function startDayDaysAgo(daysAgo: number) {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - daysAgo));
}

export async function handleGetMyArtworkAnalytics(deps: Deps) {
  try {
    const user = await deps.requireAuth();
    const artist = await deps.findOwnedArtistByUserId(user.id);
    if (!artist) return apiError(403, "forbidden", "Artist profile required");

    const artworks = await deps.listArtworksByArtistId(artist.id);
    const artworkIds = artworks.map((item) => item.id);
    const dailyRows = artworkIds.length ? await deps.listArtworkViewDailyRows(artworkIds, startDayDaysAgo(89)) : [];

    const payload = computeArtworkAnalytics(artworks, dailyRows);
    return NextResponse.json(payload, { headers: NO_STORE_HEADERS });
  } catch (error) {
    if (error instanceof Error && error.message === "unauthorized") {
      return apiError(401, "unauthorized", "Authentication required");
    }
    return apiError(500, "internal_error", "Unexpected server error");
  }
}
