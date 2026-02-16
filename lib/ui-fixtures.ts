export type UiFixtureEvent = {
  id: string;
  slug: string;
  title: string;
  startAt: string;
  endAt: string | null;
  venue: { id: string; name: string };
  tags: Array<{ slug: string }>;
  artistIds: string[];
  primaryImageUrl: string | null;
};

export type UiFixtureVenue = {
  id: string;
  slug: string;
  name: string;
  city: string;
  region: string;
  country: string;
  description: string;
  featuredImageUrl: string | null;
};

export type UiFixtureArtist = {
  id: string;
  slug: string;
  name: string;
  bio: string;
  avatarImageUrl: string | null;
  tags: string[];
};

const now = Date.now();
const dayMs = 24 * 60 * 60 * 1000;

export const uiFixtureEvents: UiFixtureEvent[] = Array.from({ length: 12 }).map((_, index) => ({
  id: `fixture-event-${index + 1}`,
  slug: `fixture-event-${index + 1}`,
  title: `Fixture Event ${index + 1}`,
  startAt: new Date(now + (index + 1) * dayMs).toISOString(),
  endAt: new Date(now + (index + 1) * dayMs + 2 * 60 * 60 * 1000).toISOString(),
  venue: { id: `fixture-venue-${(index % 6) + 1}`, name: `Fixture Venue ${(index % 6) + 1}` },
  tags: [{ slug: index % 2 ? "music" : "gallery" }, { slug: "community" }],
  artistIds: [`fixture-artist-${(index % 8) + 1}`],
  primaryImageUrl: null,
}));

export const uiFixtureVenues: UiFixtureVenue[] = Array.from({ length: 12 }).map((_, index) => ({
  id: `fixture-venue-${index + 1}`,
  slug: `fixture-venue-${index + 1}`,
  name: `Fixture Venue ${index + 1}`,
  city: "New York",
  region: "NY",
  country: "USA",
  description: "A sample venue used for UI fixture previews.",
  featuredImageUrl: null,
}));

export const uiFixtureArtists: UiFixtureArtist[] = Array.from({ length: 12 }).map((_, index) => ({
  id: `fixture-artist-${index + 1}`,
  slug: `fixture-artist-${index + 1}`,
  name: `Fixture Artist ${index + 1}`,
  bio: "Sample artist profile used for local UI checks.",
  avatarImageUrl: null,
  tags: ["installation", "painting", "live"].slice(0, (index % 3) + 1),
}));

export function useUiFixtures() {
  return process.env.NEXT_PUBLIC_UI_FIXTURES === "true";
}
