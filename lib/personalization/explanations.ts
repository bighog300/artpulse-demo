export type ExplanationKind =
  | "because_following"
  | "because_saved_search"
  | "because_recent_view"
  | "because_trending"
  | "because_nearby"
  | "because_similar_to_saved";

export type Explanation = {
  label: string;
  detail?: string;
  kind: ExplanationKind;
};

type ExplanationItem = {
  id?: string;
  slug?: string;
  title?: string;
  source?: string;
  hasLocation?: boolean;
  tags?: string[];
  artistSlugs?: string[];
  artistNames?: string[];
  venueSlug?: string | null;
  venueName?: string | null;
  type?: "event" | "artist" | "venue";
};

type ContextSignals = {
  source?: string;
  pathname?: string;
  followedArtistSlugs?: string[];
  followedVenueSlugs?: string[];
  followedArtistNames?: string[];
  followedVenueNames?: string[];
  savedSearchesCount?: number;
  savedSearchIds?: string[];
};

function normalize(value?: string | null) {
  return (value ?? "").trim().toLowerCase();
}

function includesNormalized(values: string[] | undefined, candidate?: string | null) {
  if (!candidate) return false;
  const normalizedCandidate = normalize(candidate);
  return (values ?? []).some((value) => normalize(value) === normalizedCandidate);
}

export function buildExplanation({ item, contextSignals }: { item: ExplanationItem; contextSignals: ContextSignals }): Explanation | null {
  const followedArtistSlugs = contextSignals.followedArtistSlugs ?? [];
  const followedVenueSlugs = contextSignals.followedVenueSlugs ?? [];
  const followedArtistNames = contextSignals.followedArtistNames ?? [];
  const followedVenueNames = contextSignals.followedVenueNames ?? [];

  const matchedArtistSlug = item.artistSlugs?.find((slug) => includesNormalized(followedArtistSlugs, slug));
  const matchedArtistName = item.artistNames?.find((name) => includesNormalized(followedArtistNames, name));
  if (matchedArtistSlug || matchedArtistName || (item.type === "artist" && includesNormalized(followedArtistSlugs, item.slug))) {
    return {
      kind: "because_following",
      label: `Because you follow ${matchedArtistName ?? matchedArtistSlug ?? item.title ?? item.slug ?? "this artist"}`,
      detail: "Your followed artists influence personalized ranking.",
    };
  }

  const matchedVenueSlug = item.venueSlug && includesNormalized(followedVenueSlugs, item.venueSlug) ? item.venueSlug : null;
  const matchedVenueName = item.venueName && includesNormalized(followedVenueNames, item.venueName) ? item.venueName : null;
  if (matchedVenueSlug || matchedVenueName || (item.type === "venue" && includesNormalized(followedVenueSlugs, item.slug))) {
    return {
      kind: "because_following",
      label: `Because you follow ${matchedVenueName ?? matchedVenueSlug ?? item.title ?? item.slug ?? "this venue"}`,
      detail: "Your followed venues influence personalized ranking.",
    };
  }

  if ((contextSignals.savedSearchesCount ?? 0) > 0 && (item.tags?.length ?? 0) > 0) {
    return {
      kind: "because_saved_search",
      label: "Because of your saved search",
      detail: "This item appears to match your saved search preferences.",
    };
  }

  if ((item.source ?? contextSignals.source) === "recommendations") {
    return {
      kind: "because_trending",
      label: "Recommended for you",
      detail: "Chosen using your follows, saved searches, and recent activity signals.",
    };
  }

  const isNearbyPage = (contextSignals.pathname ?? "").startsWith("/nearby") || contextSignals.source === "nearby";
  if (isNearbyPage && item.hasLocation) {
    return {
      kind: "because_nearby",
      label: "Near you",
      detail: "Based on your current location settings.",
    };
  }

  return null;
}
