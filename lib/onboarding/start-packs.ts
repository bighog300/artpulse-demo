export type StartPackType = "artist" | "venue" | "mixed";

export type StartPackDefinition = {
  id: string;
  title: string;
  description: string;
  type: StartPackType;
  keywords: string[];
  fallbackLabel?: string;
};

export const START_PACKS: StartPackDefinition[] = [
  { id: "uk-indie-nights", title: "UK Indie Nights", description: "Guitar-forward indie artists and intimate venues.", type: "mixed", keywords: ["indie", "uk", "london", "manchester"] },
  { id: "electronic-club-picks", title: "Electronic Club Picks", description: "Late-night electronic, house, and techno energy.", type: "mixed", keywords: ["electronic", "techno", "house", "club", "dj"] },
  { id: "jazz-live-sessions", title: "Jazz & Live Sessions", description: "Soulful jazz, improv sets, and live session rooms.", type: "mixed", keywords: ["jazz", "soul", "session", "live"] },
  { id: "new-york-underground", title: "New York Underground", description: "Warehouse shows, DIY stages, and city buzz.", type: "mixed", keywords: ["new york", "nyc", "brooklyn", "queens"] },
  { id: "la-sunset-shows", title: "LA Sunset Shows", description: "West-coast artists and open-air venue picks.", type: "mixed", keywords: ["los angeles", "la", "hollywood", "sunset"] },
  { id: "rising-artists", title: "Rising Artists", description: "Starter picks from emerging artists worth tracking.", type: "artist", keywords: ["emerging", "rising", "new"], fallbackLabel: "Starter picks" },
  { id: "iconic-venues", title: "Iconic Venues", description: "Must-know stages and rooms with packed calendars.", type: "venue", keywords: ["hall", "theatre", "venue", "club"] },
  { id: "weekend-energy", title: "Weekend Energy", description: "High-momentum names for Friday through Sunday.", type: "mixed", keywords: ["weekend", "party", "night", "late"], fallbackLabel: "Starter picks" },
];
