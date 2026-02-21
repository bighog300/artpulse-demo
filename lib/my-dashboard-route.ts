import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { computeArtworkAnalytics, type ArtworkAnalyticsInputDailyRow } from "@/lib/artwork-analytics";
import { resolveImageUrl } from "@/lib/assets";

type SessionUser = { id: string; role?: "USER" | "EDITOR" | "ADMIN" };

type ArtistRecord = {
  id: string;
  name: string;
  slug: string;
  bio: string | null;
  websiteUrl: string | null;
  instagramUrl: string | null;
  featuredAssetId: string | null;
  avatarImageUrl: string | null;
  featuredAsset: { url: string } | null;
};

type ArtworkRecord = {
  id: string;
  title: string;
  slug: string | null;
  isPublished: boolean;
  featuredAssetId: string | null;
  updatedAt: Date;
  featuredAsset: { url: string } | null;
  images: Array<{ id: string }>;
};

type EventRecord = {
  id: string;
  slug: string;
  title: string;
  startAt: Date;
  updatedAt: Date;
  venueId: string | null;
};

type VenueRecord = {
  id: string;
  name: string;
  slug: string;
  isPublished: boolean;
  featuredAsset: { url: string } | null;
  featuredImageUrl: string | null;
};

type Deps = {
  requireAuth: () => Promise<SessionUser>;
  findOwnedArtistByUserId: (userId: string) => Promise<ArtistRecord | null>;
  listManagedVenuesByUserId: (userId: string) => Promise<VenueRecord[]>;
  listArtworksByArtistId: (artistId: string) => Promise<ArtworkRecord[]>;
  listEventsForDashboard: (input: { artistId: string; managedVenueIds: string[]; start: Date; end: Date }) => Promise<EventRecord[]>;
  listArtworkViewDailyRows: (artworkIds: string[], start: Date) => Promise<ArtworkAnalyticsInputDailyRow[]>;
};

function startOfUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 86_400_000);
}

function profileCompleteness(artist: ArtistRecord) {
  const checks = [
    { key: "name", ok: Boolean(artist.name.trim()) },
    { key: "bio", ok: Boolean(artist.bio?.trim()) },
    { key: "avatar", ok: Boolean(artist.featuredAssetId || artist.avatarImageUrl || artist.featuredAsset?.url) },
    { key: "websiteOrSocial", ok: Boolean(artist.websiteUrl?.trim() || artist.instagramUrl?.trim()) },
  ];
  const complete = checks.filter((item) => item.ok).length;
  return {
    completenessPct: Math.round((complete / checks.length) * 100),
    missing: checks.filter((item) => !item.ok).map((item) => item.key),
  };
}

export async function handleGetMyDashboard(deps: Deps) {
  try {
    const user = await deps.requireAuth();
    const artist = await deps.findOwnedArtistByUserId(user.id);
    if (!artist) {
      return NextResponse.json({
        needsOnboarding: true,
        message: "Create your artist profile to unlock your publisher dashboard.",
        nextHref: "/my/artist",
      }, { headers: { "Cache-Control": "no-store" } });
    }

    const [managedVenues, artworks] = await Promise.all([
      deps.listManagedVenuesByUserId(user.id),
      deps.listArtworksByArtistId(artist.id),
    ]);

    const now = new Date();
    const today = startOfUtcDay(now);
    const in30 = addDays(today, 30);
    const start90 = addDays(today, -89);

    const [events, dailyRows] = await Promise.all([
      deps.listEventsForDashboard({ artistId: artist.id, managedVenueIds: managedVenues.map((v) => v.id), start: today, end: in30 }),
      artworks.length ? deps.listArtworkViewDailyRows(artworks.map((item) => item.id), start90) : Promise.resolve([]),
    ]);

    const analytics = computeArtworkAnalytics(
      artworks.map((item) => ({ id: item.id, title: item.title, slug: item.slug, isPublished: item.isPublished })),
      dailyRows,
      now,
    );

    let prior30Views = 0;
    const start30Key = addDays(today, -29).toISOString().slice(0, 10);
    const priorStartKey = addDays(today, -59).toISOString().slice(0, 10);
    const priorEndKey = addDays(today, -30).toISOString().slice(0, 10);
    for (const row of dailyRows) {
      const day = row.day.toISOString().slice(0, 10);
      if (day >= priorStartKey && day <= priorEndKey) prior30Views += row.views;
      if (day < priorStartKey || day > start30Key) continue;
    }

    const publishedCount = artworks.filter((item) => item.isPublished).length;
    const drafts = artworks.filter((item) => !item.isPublished);
    const missingCover = artworks.filter((item) => !item.featuredAssetId && item.images.length === 0);

    const upcomingEvents = events
      .filter((item) => item.startAt >= today && item.startAt <= in30)
      .sort((a, b) => a.startAt.getTime() - b.startAt.getTime());

    const profile = profileCompleteness(artist);
    const todo = [
      { id: "missing-cover", label: "Artworks missing cover image", count: missingCover.length, href: "/my/artwork?filter=missingCover" },
      { id: "draft-artwork", label: "Draft artworks to publish", count: drafts.length, href: "/my/artwork?filter=draft" },
      { id: "missing-bio", label: "Artist profile missing bio", count: artist.bio?.trim() ? 0 : 1, href: "/my/artist#bio" },
      { id: "missing-avatar", label: "Artist avatar missing", count: artist.featuredAssetId ? 0 : 1, href: "/my/artist#avatar" },
      { id: "event-missing-venue", label: "Upcoming events missing venue", count: upcomingEvents.filter((item) => !item.venueId).length, href: "/my/events?filter=missingVenue" },
    ].filter((item) => item.count > 0).slice(0, 5);

    const recent = [
      ...artworks.map((item) => ({ label: `Updated artwork: ${item.title}`, href: `/my/artwork/${item.id}`, occurredAt: item.updatedAt })),
      ...events.map((item) => ({ label: `Updated event: ${item.title}`, href: `/events/${item.slug || item.id}`, occurredAt: item.updatedAt })),
    ]
      .sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime())
      .slice(0, 8)
      .map((item) => ({ label: item.label, href: item.href, occurredAtISO: item.occurredAt.toISOString() }));

    return NextResponse.json({
      artist: {
        id: artist.id,
        name: artist.name,
        slug: artist.slug,
        avatarUrl: resolveImageUrl(artist.featuredAsset?.url, artist.avatarImageUrl),
      },
      stats: {
        artworks: { total: artworks.length, published: publishedCount, drafts: drafts.length },
        views: { last30: analytics.views.last30, last7: analytics.views.last7, last90: analytics.views.last90, prior30: prior30Views },
        upcomingEvents: {
          next30Count: upcomingEvents.length,
          nextEvent: upcomingEvents[0]
            ? { id: upcomingEvents[0].id, slug: upcomingEvents[0].slug, title: upcomingEvents[0].title, startAt: upcomingEvents[0].startAt.toISOString() }
            : undefined,
        },
        profile,
      },
      todo,
      drafts: {
        artworks: drafts.slice(0, 5).map((item) => ({ id: item.id, title: item.title, slug: item.slug, coverUrl: item.featuredAsset?.url })),
      },
      topArtworks: analytics.views.top30.slice(0, 5).map((item) => {
        const artwork = artworks.find((row) => row.id === item.artworkId);
        return { id: item.artworkId, title: item.title, slug: item.slug, views30: item.views, coverUrl: artwork?.featuredAsset?.url ?? null };
      }),
      recent,
      entities: {
        venues: managedVenues.slice(0, 3).map((venue) => ({
          id: venue.id,
          name: venue.name,
          slug: venue.slug,
          isPublished: venue.isPublished,
          coverUrl: resolveImageUrl(venue.featuredAsset?.url, venue.featuredImageUrl),
        })),
      },
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof Error && error.message === "unauthorized") return apiError(401, "unauthorized", "Authentication required");
    return apiError(500, "internal_error", "Unexpected server error");
  }
}
