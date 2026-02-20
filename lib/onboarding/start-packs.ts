import type { OnboardingSignals } from "@/lib/onboarding/signals";

export type StartPackType = "artist" | "venue" | "mixed";

type BoostRule = {
  type: "artist" | "venue";
  slug?: string;
  keyword?: string;
};

export type StartPackDefinition = {
  id: string;
  title: string;
  description: string;
  type: StartPackType;
  keywords?: string[];
  boostIfFollowed?: BoostRule[];
  explain?: (signals: OnboardingSignals) => string | null;
  fallbackLabel?: string;
};

const explainByType = (type: "artist" | "venue") => (signals: OnboardingSignals) => {
  const count = type === "artist" ? signals.followedArtistSlugs.length : signals.followedVenueSlugs.length;
  if (count < 1) return null;
  return `Because you followed ${count} ${type}${count === 1 ? "" : "s"}`;
};

export const START_PACKS: StartPackDefinition[] = [
  { id: "uk-indie-nights", title: "UK Indie Nights", description: "Guitar-forward indie artists and intimate venues.", type: "mixed", keywords: ["indie", "uk", "london", "manchester"], boostIfFollowed: [{ type: "artist", keyword: "indie" }, { type: "venue", keyword: "london" }], explain: explainByType("artist") },
  { id: "electronic-club-picks", title: "Electronic Club Picks", description: "Late-night electronic, house, and techno energy.", type: "mixed", keywords: ["electronic", "techno", "house", "club", "dj"], boostIfFollowed: [{ type: "artist", keyword: "techno" }, { type: "venue", keyword: "club" }], explain: explainByType("artist") },
  { id: "jazz-live-sessions", title: "Jazz & Live Sessions", description: "Soulful jazz, improv sets, and live session rooms.", type: "mixed", keywords: ["jazz", "soul", "session", "live"], boostIfFollowed: [{ type: "artist", keyword: "jazz" }, { type: "venue", keyword: "live" }], explain: explainByType("artist") },
  { id: "new-york-underground", title: "New York Underground", description: "Warehouse shows, DIY stages, and city buzz.", type: "mixed", keywords: ["new york", "nyc", "brooklyn", "queens"], boostIfFollowed: [{ type: "venue", keyword: "brooklyn" }], explain: explainByType("venue") },
  { id: "la-sunset-shows", title: "LA Sunset Shows", description: "West-coast artists and open-air venue picks.", type: "mixed", keywords: ["los angeles", "la", "hollywood", "sunset"], boostIfFollowed: [{ type: "venue", keyword: "hollywood" }], explain: explainByType("venue") },
  { id: "rising-artists", title: "Rising Artists", description: "Starter picks from emerging artists worth tracking.", type: "artist", keywords: ["emerging", "rising", "new"], fallbackLabel: "Starter picks" },
  { id: "iconic-venues", title: "Iconic Venues", description: "Must-know stages and rooms with packed calendars.", type: "venue", keywords: ["hall", "theatre", "venue", "club"], boostIfFollowed: [{ type: "venue", keyword: "venue" }], explain: explainByType("venue") },
  { id: "weekend-energy", title: "Weekend Energy", description: "High-momentum names for Friday through Sunday.", type: "mixed", keywords: ["weekend", "party", "night", "late"], fallbackLabel: "Starter picks" },
];
