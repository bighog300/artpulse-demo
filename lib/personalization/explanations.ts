export type ExplanationKind =
  | "because_following"
  | "because_saved_search"
  | "because_recent_view"
  | "because_trending"
  | "because_nearby"
  | "because_similar_to_saved"
  | "because_you_often_like"
  | "because_right_now"
  | "because_soon"
  | "because_try_something_new";

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
  | "downranked_tag"
  | "taste_tag"
  | "taste_venue"
  | "taste_artist"
  | "time_dow"
  | "time_daypart"
  | "recency_soon"
  | "recency_weekend"
  | "recency_past"
  | "exploration";

export type Explanation = { label: string; detail?: string; kind: ExplanationKind };

type ExplanationItem = {
  id?: string; slug?: string; title?: string; source?: string; hasLocation?: boolean; tags?: string[];
  artistSlugs?: string[]; artistNames?: string[]; venueSlug?: string | null; venueName?: string | null;
  type?: "event" | "artist" | "venue"; topReason?: TopScoreReason;
};

type ContextSignals = {
  source?: string; pathname?: string; followedArtistSlugs?: string[]; followedVenueSlugs?: string[];
  followedArtistNames?: string[]; followedVenueNames?: string[]; savedSearchesCount?: number; savedSearchIds?: string[];
};

function normalize(value?: string | null) { return (value ?? "").trim().toLowerCase(); }
function includesNormalized(values: string[] | undefined, candidate?: string | null) {
  if (!candidate) return false;
  const normalizedCandidate = normalize(candidate);
  return (values ?? []).some((value) => normalize(value) === normalizedCandidate);
}

export function buildExplanation({ item, contextSignals }: { item: ExplanationItem; contextSignals: ContextSignals }): Explanation | null {
  const topReason = item.topReason as TopScoreReason | undefined;
  if (topReason === "followed_artist") return { kind: "because_following", label: `Because you follow ${item.artistNames?.[0] ?? item.artistSlugs?.[0] ?? item.title ?? "this artist"}`, detail: "Matches artists you follow." };
  if (topReason === "followed_venue") return { kind: "because_following", label: `Because you follow ${item.venueName ?? item.venueSlug ?? item.title ?? "this venue"}`, detail: "Matches venues you follow." };
  if (topReason === "saved_search_query" || topReason === "saved_search_tag") return { kind: "because_saved_search", label: "Because of your saved search", detail: "This matched your saved search settings." };
  if (topReason === "taste_tag" || topReason === "taste_venue" || topReason === "taste_artist") return { kind: "because_you_often_like", label: "Because you often like similar events", detail: "Your recent clicks/saves suggest this fit." };
  if (topReason === "recency_soon" || topReason === "recency_weekend") return { kind: "because_soon", label: "Because it’s happening soon", detail: "Upcoming timing boosted this item." };
  if (topReason === "time_daypart" || topReason === "time_dow") return { kind: "because_right_now", label: "Because it fits right now", detail: "This aligns with your usual time-of-week patterns." };
  if (topReason === "exploration") return { kind: "because_try_something_new", label: "Try something new", detail: "We mix in fresh picks to avoid overfitting." };
  if (topReason === "recent_view_match") return { kind: "because_recent_view", label: "Because of your recent activity", detail: "Resembles what you viewed recently." };
  if (topReason === "nearby") return { kind: "because_nearby", label: "Near you", detail: "Based on your location settings." };

  const matchedArtistSlug = item.artistSlugs?.find((slug) => includesNormalized(contextSignals.followedArtistSlugs, slug));
  const matchedArtistName = item.artistNames?.find((name) => includesNormalized(contextSignals.followedArtistNames, name));
  if (matchedArtistSlug || matchedArtistName || (item.type === "artist" && includesNormalized(contextSignals.followedArtistSlugs, item.slug))) {
    return { kind: "because_following", label: `Because you follow ${matchedArtistName ?? matchedArtistSlug ?? item.title ?? item.slug ?? "this artist"}`, detail: "Your follows influence ranking." };
  }

  const matchedVenueSlug = item.venueSlug && includesNormalized(contextSignals.followedVenueSlugs, item.venueSlug) ? item.venueSlug : null;
  const matchedVenueName = item.venueName && includesNormalized(contextSignals.followedVenueNames, item.venueName) ? item.venueName : null;
  if (matchedVenueSlug || matchedVenueName || (item.type === "venue" && includesNormalized(contextSignals.followedVenueSlugs, item.slug))) {
    return { kind: "because_following", label: `Because you follow ${matchedVenueName ?? matchedVenueSlug ?? item.title ?? item.slug ?? "this venue"}`, detail: "Your follows influence ranking." };
  }

  if ((contextSignals.savedSearchesCount ?? 0) > 0 && (item.tags?.length ?? 0) > 0) return { kind: "because_saved_search", label: "Because of your saved search", detail: "Matches your saved search preferences." };
  if ((item.source ?? contextSignals.source) === "recommendations") return { kind: "because_trending", label: "Recommended for you", detail: "Chosen from follows, saved searches, and activity." };
  if (((contextSignals.pathname ?? "").startsWith("/nearby") || contextSignals.source === "nearby") && item.hasLocation) return { kind: "because_nearby", label: "Near you", detail: "Based on your current location settings." };
  return null;
}
