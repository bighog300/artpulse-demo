import test from "node:test";
import assert from "node:assert/strict";
import { scoreForYouEvents, getForYouRecommendations } from "../lib/recommendations-for-you.ts";
import { handleForYouGet } from "../lib/api-recommendations-for-you.ts";

test("API rejects unauthenticated requests", async () => {
  const req = { nextUrl: new URL("http://localhost/api/recommendations/for-you") } as never;
  const res = await handleForYouGet(req, {
    requireAuthFn: async () => { throw new Error("unauthorized"); },
    getForYouRecommendationsFn: async () => ({ windowDays: 7, items: [], candidateCount: 0 }),
  });
  assert.equal(res.status, 401);
});

test("scoring produces capped reasons and diversity dampening", () => {
  const now = new Date("2026-02-01T10:00:00.000Z");
  const venueId = "venue-1";
  const events = [1, 2, 3].map((n) => ({
    id: `e${n}`,
    title: `Event ${n}`,
    slug: `event-${n}`,
    startAt: new Date(`2026-02-0${n}T12:00:00.000Z`),
    lat: null,
    lng: null,
    venueId,
    venue: { name: "Venue", slug: "venue", city: null, lat: null, lng: null },
    images: [],
    eventArtists: [{ artistId: "a1" }],
    eventTags: [{ tagId: "t1", tag: { slug: "tag" } }],
  }));

  const ranked = scoreForYouEvents({
    now,
    events,
    followedVenueIds: new Set([venueId]),
    followedArtistIds: new Set(["a1"]),
    savedSearchMatches: new Map([["e1", ["Weekend near me"]]]),
    nearbyMatches: new Set(["e1", "e2", "e3"]),
    affinityVenueIds: new Set([venueId]),
    affinityArtistIds: new Set(["a1"]),
    affinityTagIds: new Set(["t1"]),
    locationLabel: "Bristol",
    radiusKm: 25,
  });

  assert.ok(ranked[0].reasons.length <= 3);
  const third = ranked.find((item) => item.event.id === "e3");
  assert.ok(third);
  assert.equal(third!.score, third!.rawScore - 3);
});

test("candidate pool cap and published filtering are respected", async () => {
  const allEvents = Array.from({ length: 450 }, (_, i) => ({
    id: `id-${i + 1}`,
    title: `Event ${i + 1}`,
    slug: `event-${i + 1}`,
    startAt: new Date("2026-03-10T10:00:00.000Z"),
    lat: null,
    lng: null,
    venueId: `v-${(i % 3) + 1}`,
    venue: { name: "Venue", slug: "venue", city: null, lat: null, lng: null },
    images: [],
    eventArtists: [{ artistId: `a-${(i % 4) + 1}` }],
    eventTags: [{ tagId: `t-${(i % 5) + 1}`, tag: { slug: "x" } }],
    isPublished: i % 9 !== 0,
  }));

  const db = {
    user: { findUnique: async () => ({ locationLat: null, locationLng: null, locationRadiusKm: 25, locationLabel: null }) },
    follow: { findMany: async () => [{ targetType: "VENUE", targetId: "v-1" }] },
    savedSearch: { findMany: async () => [] },
    engagementEvent: { findMany: async () => [] },
    event: {
      findMany: async (args: any) => {
        if (args.select?.id && !args.select?.title) {
          return allEvents.slice(0, Math.min(args.take ?? allEvents.length, allEvents.length)).map((e) => ({ id: e.id }));
        }
        const ids = new Set(args.where.id.in as string[]);
        return allEvents.filter((e) => ids.has(e.id) && e.isPublished).map((e) => ({
          id: e.id,
          title: e.title,
          slug: e.slug,
          startAt: e.startAt,
          lat: e.lat,
          lng: e.lng,
          venueId: e.venueId,
          venue: e.venue,
          images: e.images,
          eventArtists: e.eventArtists,
          eventTags: e.eventTags,
        }));
      },
    },
  } as never;

  const result = await getForYouRecommendations(db, { userId: "u1", days: 30, limit: 30 });
  assert.ok(result.candidateCount <= 400);
  const unpublishedIds = new Set(allEvents.filter((e) => !e.isPublished).map((e) => e.id));
  assert.equal(result.items.some((item) => unpublishedIds.has(item.event.id)), false);
});
