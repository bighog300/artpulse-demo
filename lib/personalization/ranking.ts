import { getPreferenceSnapshot, type PreferenceEntityType } from "@/lib/personalization/preferences";

export const PERSONALIZATION_WEIGHTS = {
  followedVenue: 40,
  followedArtist: 35,
  savedSearchQuery: 25,
  savedSearchTag: 20,
  recentViewMatch: 15,
  nearby: 10,
  forYouBaseline: 5,
  downrankVenue: -35,
  downrankArtist: -35,
  downrankTag: -25,
} as const;

export type RankingReasonKey =
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

export type RankingBreakdown = Array<{ key: RankingReasonKey; value: number }>;

export type RankableItem = {
  id?: string;
  slug?: string;
  title?: string;
  source?: string;
  entityType?: PreferenceEntityType;
  venueSlug?: string | null;
  artistSlugs?: string[];
  tags?: string[];
  primaryTag?: string | null;
  hasLocation?: boolean;
  sourceCategory?: "follow" | "trending" | "nearby" | null;
};

export type RankingSignals = {
  followedVenueSlugs?: string[];
  followedArtistSlugs?: string[];
  savedSearchQueries?: string[];
  savedSearchTags?: string[];
  recentViewTerms?: string[];
  hasLocation?: boolean;
};

export type RankingPreferences = {
  hiddenItems?: string[];
  downrankVenues?: string[];
  downrankArtists?: string[];
  downrankTags?: string[];
};

export type RankedItem<T> = {
  item: T;
  score: number;
  breakdown: RankingBreakdown;
  topReason: RankingReasonKey | null;
};

function normalize(value?: string | null) {
  return (value ?? "").trim().toLowerCase();
}

function normalizedSet(values?: string[]) {
  return new Set((values ?? []).map((value) => normalize(value)).filter(Boolean));
}

function itemKey(type: PreferenceEntityType, idOrSlug: string) {
  return `${type}:${normalize(idOrSlug)}`;
}

function matchAny(values: string[] | undefined, set: Set<string>) {
  return (values ?? []).some((value) => set.has(normalize(value)));
}

function textMatch(needleSet: Set<string>, item: RankableItem) {
  const text = `${item.title ?? ""} ${(item.tags ?? []).join(" ")}`.toLowerCase();
  return Array.from(needleSet).some((needle) => needle && text.includes(needle));
}

function scoreItem(item: RankableItem, signals: RankingSignals, preferences: RankingPreferences, source: string): Omit<RankedItem<RankableItem>, "item"> {
  const followedVenueSlugs = normalizedSet(signals.followedVenueSlugs);
  const followedArtistSlugs = normalizedSet(signals.followedArtistSlugs);
  const savedSearchQueries = normalizedSet(signals.savedSearchQueries);
  const savedSearchTags = normalizedSet(signals.savedSearchTags);
  const recentViewTerms = normalizedSet(signals.recentViewTerms);
  const downrankVenueSet = normalizedSet(preferences.downrankVenues);
  const downrankArtistSet = normalizedSet(preferences.downrankArtists);
  const downrankTagSet = normalizedSet(preferences.downrankTags);

  const breakdown: RankingBreakdown = [];

  if (item.venueSlug && followedVenueSlugs.has(normalize(item.venueSlug))) {
    breakdown.push({ key: "followed_venue", value: PERSONALIZATION_WEIGHTS.followedVenue });
  }
  if (matchAny(item.artistSlugs, followedArtistSlugs)) {
    breakdown.push({ key: "followed_artist", value: PERSONALIZATION_WEIGHTS.followedArtist });
  }
  if (savedSearchQueries.size && textMatch(savedSearchQueries, item)) {
    breakdown.push({ key: "saved_search_query", value: PERSONALIZATION_WEIGHTS.savedSearchQuery });
  }
  if (savedSearchTags.size && matchAny(item.tags, savedSearchTags)) {
    breakdown.push({ key: "saved_search_tag", value: PERSONALIZATION_WEIGHTS.savedSearchTag });
  }
  if (recentViewTerms.size && textMatch(recentViewTerms, item)) {
    breakdown.push({ key: "recent_view_match", value: PERSONALIZATION_WEIGHTS.recentViewMatch });
  }
  if ((signals.hasLocation || item.hasLocation) && item.hasLocation) {
    breakdown.push({ key: "nearby", value: PERSONALIZATION_WEIGHTS.nearby });
  }
  if (source === "for_you") {
    breakdown.push({ key: "for_you_baseline", value: PERSONALIZATION_WEIGHTS.forYouBaseline });
  }

  if (item.venueSlug && downrankVenueSet.has(normalize(item.venueSlug))) {
    breakdown.push({ key: "downranked_venue", value: PERSONALIZATION_WEIGHTS.downrankVenue });
  }
  if (matchAny(item.artistSlugs, downrankArtistSet)) {
    breakdown.push({ key: "downranked_artist", value: PERSONALIZATION_WEIGHTS.downrankArtist });
  }
  if (matchAny(item.tags, downrankTagSet)) {
    breakdown.push({ key: "downranked_tag", value: PERSONALIZATION_WEIGHTS.downrankTag });
  }

  const score = breakdown.reduce((sum, part) => sum + part.value, 0);
  const topReason = [...breakdown].sort((a, b) => Math.abs(b.value) - Math.abs(a.value) || b.value - a.value)[0]?.key ?? null;

  return { score, breakdown, topReason };
}

function applyDiversity<T extends RankableItem>(items: RankedItem<T>[]) {
  const ranked = [...items];
  const top: RankedItem<T>[] = [];
  const remaining: RankedItem<T>[] = [];
  const topWindow = Math.min(10, ranked.length);

  const availableCategories = new Set(ranked.map((entry) => entry.item.sourceCategory).filter((value): value is "follow" | "trending" | "nearby" => Boolean(value)));
  const maxPerCategory = availableCategories.size ? Math.ceil(topWindow / availableCategories.size) : topWindow;
  const categoryCounts = new Map<string, number>();

  const venueCounts = new Map<string, number>();
  const tagStreak: string[] = [];

  while (top.length < topWindow && ranked.length) {
    const nextIndex = ranked.findIndex((candidate) => {
      const venue = normalize(candidate.item.venueSlug);
      const primaryTag = normalize(candidate.item.primaryTag ?? candidate.item.tags?.[0]);
      const category = candidate.item.sourceCategory;

      if (venue && (venueCounts.get(venue) ?? 0) >= 2) return false;
      if (primaryTag && tagStreak.length >= 3 && tagStreak.slice(-3).every((tag) => tag === primaryTag)) return false;
      if (category && (categoryCounts.get(category) ?? 0) >= maxPerCategory) {
        const hasAlternative = ranked.some((item) => item.item.sourceCategory && (categoryCounts.get(item.item.sourceCategory) ?? 0) < maxPerCategory);
        if (hasAlternative) return false;
      }
      return true;
    });

    if (nextIndex < 0) break;
    const selected = ranked.splice(nextIndex, 1)[0];
    top.push(selected);

    const venue = normalize(selected.item.venueSlug);
    if (venue) venueCounts.set(venue, (venueCounts.get(venue) ?? 0) + 1);

    const primaryTag = normalize(selected.item.primaryTag ?? selected.item.tags?.[0]);
    if (primaryTag) tagStreak.push(primaryTag);

    const category = selected.item.sourceCategory;
    if (category) categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1);
  }

  remaining.push(...ranked);
  return [...top, ...remaining];
}

export function rankItems<T extends RankableItem>(items: T[], args: { signals?: RankingSignals; preferences?: RankingPreferences; source: string }) {
  const preferences = args.preferences ?? getPreferenceSnapshot();
  const signals = args.signals ?? {};

  const visible = items.filter((item) => {
    const type = item.entityType ?? "event";
    const idOrSlug = item.slug ?? item.id;
    if (!idOrSlug) return true;
    return !(preferences.hiddenItems ?? []).includes(itemKey(type, idOrSlug));
  });

  const scored = visible.map((item) => ({ item, ...scoreItem(item, signals, preferences, args.source) }));
  scored.sort((a, b) => b.score - a.score || (a.item.id ?? a.item.slug ?? "").localeCompare(b.item.id ?? b.item.slug ?? ""));

  const diversified = applyDiversity(scored);
  return diversified;
}
