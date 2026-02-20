export type ExplanationKind =
  | "because_following"
  | "because_saved_search"
  | "because_recent_view"
  | "because_trending"
  | "because_nearby"
  | "because_similar_to_saved";

type TopScoreReason =
  | "followed_venue"
  | "followed_artist"
  | "saved_search_query"
  | "saved_search_tag"
  | "recent_view_match"
  | "nearby"
  | "for_you_baseline"
  | "downranked_venue"
  | "downranked_artist"
  | "downranked_tag";

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
  topReason?: TopScoreReason;
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
  const topReason = item.topReason as TopScoreReason | undefined;
  if (topReason === "followed_artist") {
    return {
      kind: "because_following",
      label: `Because you follow ${item.artistNames?.[0] ?? item.artistSlugs?.[0] ?? item.title ?? "this artist"}`,
      detail: "This ranked highest because it matches artists you follow.",
    };
  }
  if (topReason === "followed_venue") {
    return {
      kind: "because_following",
      label: `Because you follow ${item.venueName ?? item.venueSlug ?? item.title ?? "this venue"}`,
      detail: "This ranked highest because it matches venues you follow.",
    };
  }
  if (topReason === "saved_search_query" || topReason === "saved_search_tag") {
    return {
      kind: "because_saved_search",
      label: "Because of your saved search",
      detail: "This ranked highest because it matched your saved search query or tags.",
    };
  }
  if (topReason === "recent_view_match") {
    return {
      kind: "because_recent_view",
      label: "Because of your recent activity",
      detail: "This ranked highest because it resembles what you viewed recently.",
    };
  }
  if (topReason === "nearby") {
    return {
      kind: "because_nearby",
      label: "Near you",
      detail: "This ranked highest because it is near your location settings.",
    };
  }

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
