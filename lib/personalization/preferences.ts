export type PreferenceEntityType = "event" | "artist" | "venue";

export const PERSONALIZATION_KEYS = {
  hiddenItems: "ap_hidden_items",
  downrankTags: "ap_downrank_tags",
  downrankVenues: "ap_downrank_venues",
  downrankArtists: "ap_downrank_artists",
  feedbackEvents: "ap_feedback_events",
} as const;

const FEEDBACK_LIMIT = 50;

type PreferenceItem = { type: PreferenceEntityType; idOrSlug: string };
type FeedbackEvent = PreferenceItem & { action: "hide" | "show_less"; at: string };

type FilterableItem = {
  id?: string;
  slug?: string;
  tags?: string[];
  venueSlug?: string | null;
  artistSlugs?: string[];
  type?: PreferenceEntityType;
};

function storage() {
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

function readArray(key: string): string[] {
  try {
    const raw = storage()?.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function writeArray(key: string, values: string[]) {
  try {
    storage()?.setItem(key, JSON.stringify(Array.from(new Set(values)).slice(0, FEEDBACK_LIMIT)));
  } catch {
    // ignore write errors
  }
}

function readFeedbackEvents(): FeedbackEvent[] {
  try {
    const raw = storage()?.getItem(PERSONALIZATION_KEYS.feedbackEvents);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is FeedbackEvent => Boolean(item && typeof item === "object")) : [];
  } catch {
    return [];
  }
}

function writeFeedbackEvents(events: FeedbackEvent[]) {
  try {
    storage()?.setItem(PERSONALIZATION_KEYS.feedbackEvents, JSON.stringify(events.slice(0, FEEDBACK_LIMIT)));
  } catch {
    // ignore write errors
  }
}

function itemKey({ type, idOrSlug }: PreferenceItem) {
  return `${type}:${idOrSlug.trim().toLowerCase()}`;
}

function addFeedback(action: FeedbackEvent["action"], item: PreferenceItem) {
  const next: FeedbackEvent = { ...item, action, at: new Date().toISOString() };
  writeFeedbackEvents([next, ...readFeedbackEvents()]);
}

export function hideItem(item: PreferenceItem) {
  const hidden = readArray(PERSONALIZATION_KEYS.hiddenItems);
  writeArray(PERSONALIZATION_KEYS.hiddenItems, [itemKey(item), ...hidden]);
  addFeedback("hide", item);
}

export function showLessLikeThis(item: PreferenceItem & { tags?: string[] }) {
  if (item.type === "artist") {
    writeArray(PERSONALIZATION_KEYS.downrankArtists, [item.idOrSlug, ...readArray(PERSONALIZATION_KEYS.downrankArtists)]);
  }
  if (item.type === "venue") {
    writeArray(PERSONALIZATION_KEYS.downrankVenues, [item.idOrSlug, ...readArray(PERSONALIZATION_KEYS.downrankVenues)]);
  }
  if (item.tags?.length) {
    writeArray(PERSONALIZATION_KEYS.downrankTags, [...item.tags, ...readArray(PERSONALIZATION_KEYS.downrankTags)]);
  }
  hideItem(item);
  addFeedback("show_less", item);
}

export function isHidden(item: PreferenceItem) {
  return readArray(PERSONALIZATION_KEYS.hiddenItems).includes(itemKey(item));
}

export function filterHidden<T extends FilterableItem>(items: T[], type: PreferenceEntityType): T[] {
  return items.filter((item) => {
    const idOrSlug = item.slug ?? item.id;
    if (!idOrSlug) return true;
    return !isHidden({ type, idOrSlug });
  });
}

export function getPreferenceSnapshot() {
  return {
    hiddenItems: readArray(PERSONALIZATION_KEYS.hiddenItems),
    downrankTags: readArray(PERSONALIZATION_KEYS.downrankTags),
    downrankVenues: readArray(PERSONALIZATION_KEYS.downrankVenues),
    downrankArtists: readArray(PERSONALIZATION_KEYS.downrankArtists),
    feedbackEvents: readFeedbackEvents(),
  };
}

export function clearHiddenItems() {
  try {
    storage()?.removeItem(PERSONALIZATION_KEYS.hiddenItems);
  } catch {}
}

export function resetPersonalization() {
  const store = storage();
  if (!store) return;
  Object.values(PERSONALIZATION_KEYS).forEach((key) => {
    try { store.removeItem(key); } catch {}
  });
}

export function removeDownrankValue(key: "downrankTags" | "downrankVenues" | "downrankArtists", value: string) {
  const map = {
    downrankTags: PERSONALIZATION_KEYS.downrankTags,
    downrankVenues: PERSONALIZATION_KEYS.downrankVenues,
    downrankArtists: PERSONALIZATION_KEYS.downrankArtists,
  } as const;
  writeArray(map[key], readArray(map[key]).filter((item) => item !== value));
}

export function applyDownrankSort<T extends FilterableItem>(items: T[]): T[] {
  const { downrankArtists, downrankTags, downrankVenues } = getPreferenceSnapshot();
  const downrankArtistSet = new Set(downrankArtists.map((item) => item.toLowerCase()));
  const downrankTagSet = new Set(downrankTags.map((item) => item.toLowerCase()));
  const downrankVenueSet = new Set(downrankVenues.map((item) => item.toLowerCase()));

  return [...items].sort((a, b) => scorePenalty(a, downrankArtistSet, downrankVenueSet, downrankTagSet) - scorePenalty(b, downrankArtistSet, downrankVenueSet, downrankTagSet));
}

function scorePenalty(item: FilterableItem, artists: Set<string>, venues: Set<string>, tags: Set<string>) {
  let penalty = 0;
  if (item.venueSlug && venues.has(item.venueSlug.toLowerCase())) penalty += 3;
  if (item.artistSlugs?.some((slug) => artists.has(slug.toLowerCase()))) penalty += 3;
  if (item.tags?.some((tag) => tags.has(tag.toLowerCase()))) penalty += 2;
  return penalty;
}
