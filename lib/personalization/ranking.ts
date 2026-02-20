import { getPreferenceSnapshot, type PreferenceEntityType } from "@/lib/personalization/preferences";
import { loadTasteModel, type TasteModel } from "@/lib/personalization/taste";

export const RANKING_VERSION = "v3_0";

function isV3Enabled() {
  return process.env.NEXT_PUBLIC_PERSONALIZATION_VERSION !== "v2";
}

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
  tasteTagMultiplier: 8,
  tasteVenueMultiplier: 12,
  tasteArtistMultiplier: 10,
  dowMultiplier: 6,
  daypartMultiplier: 6,
  soonBoost: 8,
  weekendBoost: 10,
  pastPenalty: -200,
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
  startAt?: string | Date | null;
  isExplorationCandidate?: boolean;
};

export type RankingSignals = {
  followedVenueSlugs?: string[];
  followedArtistSlugs?: string[];
  savedSearchQueries?: string[];
  savedSearchTags?: string[];
  recentViewTerms?: string[];
  hasLocation?: boolean;
  tasteModel?: TasteModel;
  now?: Date;
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
  topReasonKind?: "positive" | "negative" | null;
  debug?: { score: number; breakdown: RankingBreakdown; topReasonKind: "positive" | "negative" | null; v: "v3" };
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

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function daypart(now: Date): keyof TasteModel["daypartWeights"] {
  const hour = now.getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  if (hour < 22) return "evening";
  return "night";
}

function dow(now: Date): keyof TasteModel["dowWeights"] {
  return ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][now.getDay()] as keyof TasteModel["dowWeights"];
}

function scoreRecency(item: RankableItem, now: Date) {
  const breakdown: RankingBreakdown = [];
  if (!item.startAt) return breakdown;
  const startAt = item.startAt instanceof Date ? item.startAt : new Date(item.startAt);
  if (Number.isNaN(startAt.getTime())) return breakdown;
  const diffMs = startAt.getTime() - now.getTime();
  if (diffMs < 0) {
    breakdown.push({ key: "recency_past", value: PERSONALIZATION_WEIGHTS.pastPenalty });
    return breakdown;
  }

  const within72h = diffMs <= 72 * 60 * 60 * 1000;
  if (within72h) breakdown.push({ key: "recency_soon", value: PERSONALIZATION_WEIGHTS.soonBoost });

  const day = now.getDay();
  const isThuToSun = day >= 4 || day === 0;
  const eventDow = startAt.getDay();
  const isWeekendEvent = eventDow === 0 || eventDow === 6;
  if (isThuToSun && isWeekendEvent) breakdown.push({ key: "recency_weekend", value: PERSONALIZATION_WEIGHTS.weekendBoost });
  return breakdown;
}

function scoreItem(item: RankableItem, signals: RankingSignals, preferences: RankingPreferences, source: string, useV3: boolean): Omit<RankedItem<RankableItem>, "item"> {
  const followedVenueSlugs = normalizedSet(signals.followedVenueSlugs);
  const followedArtistSlugs = normalizedSet(signals.followedArtistSlugs);
  const savedSearchQueries = normalizedSet(signals.savedSearchQueries);
  const savedSearchTags = normalizedSet(signals.savedSearchTags);
  const recentViewTerms = normalizedSet(signals.recentViewTerms);
  const downrankVenueSet = normalizedSet(preferences.downrankVenues);
  const downrankArtistSet = normalizedSet(preferences.downrankArtists);
  const downrankTagSet = normalizedSet(preferences.downrankTags);
  const taste = signals.tasteModel ?? loadTasteModel();
  const now = signals.now ?? new Date();

  const breakdown: RankingBreakdown = [];

  if (item.venueSlug && followedVenueSlugs.has(normalize(item.venueSlug))) breakdown.push({ key: "followed_venue", value: PERSONALIZATION_WEIGHTS.followedVenue });
  if (matchAny(item.artistSlugs, followedArtistSlugs)) breakdown.push({ key: "followed_artist", value: PERSONALIZATION_WEIGHTS.followedArtist });
  if (savedSearchQueries.size && textMatch(savedSearchQueries, item)) breakdown.push({ key: "saved_search_query", value: PERSONALIZATION_WEIGHTS.savedSearchQuery });
  if (savedSearchTags.size && matchAny(item.tags, savedSearchTags)) breakdown.push({ key: "saved_search_tag", value: PERSONALIZATION_WEIGHTS.savedSearchTag });
  if (recentViewTerms.size && textMatch(recentViewTerms, item)) breakdown.push({ key: "recent_view_match", value: PERSONALIZATION_WEIGHTS.recentViewMatch });
  if ((signals.hasLocation || item.hasLocation) && item.hasLocation) breakdown.push({ key: "nearby", value: PERSONALIZATION_WEIGHTS.nearby });
  if (source === "for_you") breakdown.push({ key: "for_you_baseline", value: PERSONALIZATION_WEIGHTS.forYouBaseline });

  if (useV3) {
    const tagTaste = clamp((item.tags ?? []).reduce((sum, tag) => sum + (taste.tagWeights[normalize(tag)] ?? 0), 0) * PERSONALIZATION_WEIGHTS.tasteTagMultiplier, -24, 24);
    if (tagTaste) breakdown.push({ key: "taste_tag", value: tagTaste });
    const venueTaste = clamp((taste.venueWeights[normalize(item.venueSlug)] ?? 0) * PERSONALIZATION_WEIGHTS.tasteVenueMultiplier, -24, 24);
    if (venueTaste) breakdown.push({ key: "taste_venue", value: venueTaste });
    const artistTaste = clamp((item.artistSlugs ?? []).reduce((sum, slug) => sum + (taste.artistWeights[normalize(slug)] ?? 0), 0) * PERSONALIZATION_WEIGHTS.tasteArtistMultiplier, -24, 24);
    if (artistTaste) breakdown.push({ key: "taste_artist", value: artistTaste });

    const dowBoost = (taste.dowWeights[dow(now)] ?? 0) * PERSONALIZATION_WEIGHTS.dowMultiplier;
    if (dowBoost) breakdown.push({ key: "time_dow", value: clamp(dowBoost, -18, 18) });
    const daypartBoost = (taste.daypartWeights[daypart(now)] ?? 0) * PERSONALIZATION_WEIGHTS.daypartMultiplier;
    if (daypartBoost) breakdown.push({ key: "time_daypart", value: clamp(daypartBoost, -18, 18) });

    breakdown.push(...scoreRecency(item, now));
  }

  if (item.venueSlug && downrankVenueSet.has(normalize(item.venueSlug))) breakdown.push({ key: "downranked_venue", value: PERSONALIZATION_WEIGHTS.downrankVenue });
  if (matchAny(item.artistSlugs, downrankArtistSet)) breakdown.push({ key: "downranked_artist", value: PERSONALIZATION_WEIGHTS.downrankArtist });
  if (matchAny(item.tags, downrankTagSet)) breakdown.push({ key: "downranked_tag", value: PERSONALIZATION_WEIGHTS.downrankTag });

  const score = breakdown.reduce((sum, part) => sum + part.value, 0);
  const strongest = [...breakdown].sort((a, b) => Math.abs(b.value) - Math.abs(a.value) || b.value - a.value)[0];
  const topReason = strongest?.key ?? null;
  const topReasonKind = strongest ? (strongest.value >= 0 ? "positive" : "negative") : null;

  return { score, breakdown, topReason, topReasonKind };
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

    let resolvedIndex = nextIndex;
    if (resolvedIndex < 0) {
      resolvedIndex = ranked.findIndex((candidate) => {
        const venue = normalize(candidate.item.venueSlug);
        return !(venue && (venueCounts.get(venue) ?? 0) >= 2);
      });
    }
    if (resolvedIndex < 0) break;
    const selected = ranked.splice(resolvedIndex, 1)[0];
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


function enforceVenueCapTop10<T extends RankableItem>(items: RankedItem<T>[]) {
  const result = [...items];
  const topWindow = Math.min(10, result.length);
  const counts = new Map<string, number>();

  for (let i = 0; i < topWindow; i += 1) {
    const venue = normalize(result[i].item.venueSlug);
    if (!venue) continue;
    const nextCount = (counts.get(venue) ?? 0) + 1;
    counts.set(venue, nextCount);
    if (nextCount <= 2) continue;

    const swapIndex = result.findIndex((candidate, idx) => idx > i && idx < result.length && (() => {
      const candidateVenue = normalize(candidate.item.venueSlug);
      return !candidateVenue || (counts.get(candidateVenue) ?? 0) < 2;
    })());
    if (swapIndex < 0) continue;
    const [candidate] = result.splice(swapIndex, 1);
    result.splice(i, 0, candidate);
    result.splice(i + 1, 1);
    i -= 1;
  }

  return result;
}
function seededIndex(seed: number, len: number) {
  if (len <= 0) return -1;
  const x = Math.sin(seed * 10007) * 10000;
  return Math.abs(Math.floor((x - Math.floor(x)) * len)) % len;
}

export function mixExploration<T extends RankableItem>(items: RankedItem<T>[], args: { explorationRate?: number; seed?: number }) {
  const rate = args.explorationRate ?? 0.2;
  if (items.length < 6 || rate <= 0) return { items, count: 0, rate };

  const explorationPool = items.filter((entry) => entry.item.isExplorationCandidate || entry.breakdown.every((part) => !part.key.startsWith("taste_"))).slice(5);
  const exploitPool = [...items];
  const mixed: RankedItem<T>[] = [];
  let inserted = 0;
  let batch = 0;

  while (exploitPool.length && mixed.length < 20) {
    for (let i = 0; i < 4 && exploitPool.length; i += 1) mixed.push(exploitPool.shift() as RankedItem<T>);

    const shouldExplore = ((batch + (args.seed ?? 1)) % Math.max(1, Math.round(1 / rate))) === 0;
    if (!shouldExplore || !explorationPool.length) continue;
    const pick = seededIndex((args.seed ?? 1) + batch, explorationPool.length);
    const selected = explorationPool.splice(pick, 1)[0];
    if (!selected) continue;
    const idx = exploitPool.findIndex((entry) => (entry.item.id ?? entry.item.slug) === (selected.item.id ?? selected.item.slug));
    if (idx >= 0) exploitPool.splice(idx, 1);
    mixed.push({
      ...selected,
      score: selected.score + 0.01,
      breakdown: [...selected.breakdown, { key: "exploration", value: 1 }],
      topReason: selected.topReason ?? "exploration",
    });
    inserted += 1;
    batch += 1;
  }

  mixed.push(...exploitPool);
  return { items: mixed, count: inserted, rate };
}

export function rankItems<T extends RankableItem>(items: T[], args: { signals?: RankingSignals; preferences?: RankingPreferences; source: string; explorationRate?: number; seed?: number }) {
  const preferences = args.preferences ?? getPreferenceSnapshot();
  const signals = args.signals ?? {};

  const visible = items.filter((item) => {
    const type = item.entityType ?? "event";
    const idOrSlug = item.slug ?? item.id;
    if (!idOrSlug) return true;
    return !(preferences.hiddenItems ?? []).includes(itemKey(type, idOrSlug));
  });

  const useV3 = isV3Enabled();
  const scored = visible.map((item) => ({ item, ...scoreItem(item, signals, preferences, args.source, useV3) }));
  scored.sort((a, b) => b.score - a.score || (a.item.id ?? a.item.slug ?? "").localeCompare(b.item.id ?? b.item.slug ?? ""));

  const mixed = useV3 ? mixExploration(scored, { explorationRate: args.explorationRate ?? 0.2, seed: args.seed }).items : scored;
  const diversified = enforceVenueCapTop10(applyDiversity(mixed)).map((entry) => ({
    ...entry,
    debug: process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_PERSONALIZATION_DEBUG === "true"
      ? { score: entry.score, breakdown: entry.breakdown, topReasonKind: entry.topReasonKind ?? null, v: "v3" as const }
      : undefined,
  }));

  return diversified;
}
