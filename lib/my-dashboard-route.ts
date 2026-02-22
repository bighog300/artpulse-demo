import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { resolveImageUrl } from "@/lib/assets";
import { computeArtworkAnalytics, type ArtworkAnalyticsInputDailyRow } from "@/lib/artwork-analytics";

type SessionUser = { id: string };

type ArtistRecord = {
  id: string;
  name: string;
  slug: string;
  bio: string | null;
  websiteUrl: string | null;
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
  images: Array<{ asset: { url: string } }>;
  _count: { images: number };
};

type EventRecord = {
  id: string;
  title: string;
  slug: string;
  startAt: Date;
  updatedAt: Date;
  isPublished: boolean;
  venueId: string | null;
  venue: { name: string } | null;
};

type VenueRecord = { id: string };

type ManagedVenueRecord = {
  id: string;
  slug: string | null;
  name: string;
  city: string | null;
  country: string | null;
  isPublished: boolean;
  featuredAssetId: string | null;
  featuredAsset: { url: string } | null;
  submissions: Array<{ status: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED" }>;
};

type AuditRecord = {
  action: string;
  targetId: string | null;
  createdAt: Date;
};

type Deps = {
  requireAuth: () => Promise<SessionUser>;
  findOwnedArtistByUserId: (userId: string) => Promise<ArtistRecord | null>;
  listManagedVenuesByUserId: (userId: string) => Promise<VenueRecord[]>;
  listManagedVenueDetailsByUserId: (userId: string) => Promise<ManagedVenueRecord[]>;
  listArtworksByArtistId: (artistId: string) => Promise<ArtworkRecord[]>;
  listEventsByContext: (input: { artistId: string; managedVenueIds: string[] }) => Promise<EventRecord[]>;
  listArtworkViewDailyRows: (artworkIds: string[], start: Date) => Promise<ArtworkAnalyticsInputDailyRow[]>;
  listRecentAuditActivity?: (userId: string) => Promise<AuditRecord[]>;
};

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

function startOfUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 86_400_000);
}

function mapAuditToRecent(audits: AuditRecord[]) {
  const allowlist = new Set([
    "ARTWORK_CREATED",
    "ARTWORK_UPDATED",
    "ARTWORK_PUBLISHED",
    "EVENT_CREATED",
    "EVENT_UPDATED",
    "EVENT_SUBMITTED",
    "VENUE_CREATED",
    "VENUE_UPDATED",
    "VENUE_SUBMITTED",
    "IMPORT_APPLIED",
  ]);

  return audits
    .filter((entry) => allowlist.has(entry.action))
    .slice(0, 8)
    .map((entry) => ({
      label: entry.action.replaceAll("_", " ").toLowerCase().replace(/(^|\s)\w/g, (char) => char.toUpperCase()),
      href: entry.targetId ? `/my/${entry.targetId}` : "/my",
      occurredAtISO: entry.createdAt.toISOString(),
    }));
}

function synthesizeRecent(artworks: ArtworkRecord[], events: EventRecord[]) {
  return [
    ...artworks.slice(0, 4).map((item) => ({ label: `Updated artwork: ${item.title}`, href: `/my/artwork/${item.id}`, occurredAtISO: item.updatedAt.toISOString(), occurredAt: item.updatedAt })),
    ...events.slice(0, 4).map((item) => ({ label: `Updated event: ${item.title}`, href: `/my/events/${item.id}`, occurredAtISO: item.updatedAt.toISOString(), occurredAt: item.updatedAt })),
  ]
    .sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime())
    .slice(0, 8)
    .map(({ label, href, occurredAtISO }) => ({ label, href, occurredAtISO }));
}

function getProfileCompleteness(artist: ArtistRecord, publishedArtworkCount: number) {
  const checks = [
    { key: "bio", ok: Boolean(artist.bio?.trim()) },
    { key: "websiteUrl", ok: Boolean(artist.websiteUrl?.trim()) },
    { key: "avatar", ok: Boolean(artist.featuredAssetId || artist.avatarImageUrl || artist.featuredAsset?.url) },
    { key: "publishedArtwork", ok: publishedArtworkCount > 0 },
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
        message: "Create your artist profile to get started.",
        nextHref: "/my/artist",
      }, { headers: NO_STORE_HEADERS });
    }

    const [managedVenues, managedVenueDetails, artworks] = await Promise.all([
      deps.listManagedVenuesByUserId(user.id),
      deps.listManagedVenueDetailsByUserId(user.id),
      deps.listArtworksByArtistId(artist.id),
    ]);

    const now = new Date();
    const today = startOfUtcDay(now);
    const start90 = addDays(today, -89);
    const next30 = addDays(today, 30);

    const [events, dailyRows, audits] = await Promise.all([
      deps.listEventsByContext({ artistId: artist.id, managedVenueIds: managedVenues.map((venue) => venue.id) }),
      artworks.length > 0 ? deps.listArtworkViewDailyRows(artworks.map((artwork) => artwork.id), start90) : Promise.resolve([]),
      deps.listRecentAuditActivity ? deps.listRecentAuditActivity(user.id) : Promise.resolve([]),
    ]);

    const analytics = computeArtworkAnalytics(
      artworks.map((item) => ({ id: item.id, title: item.title, slug: item.slug, isPublished: item.isPublished })),
      dailyRows,
      now,
    );

    const publishedArtworkCount = artworks.filter((item) => item.isPublished).length;
    const artworkDraftCount = artworks.length - publishedArtworkCount;
    const missingCoverCount = artworks.filter((item) => !item.featuredAssetId && item._count.images === 0).length;

    const upcomingEvents = events
      .filter((item) => item.startAt >= today && item.startAt <= next30)
      .sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
    const draftEventCount = events.filter((item) => !item.isPublished).length;
    const missingVenueCount = events.filter((item) => !item.venueId).length;

    const managedVenueIds = new Set(managedVenues.map((venue) => venue.id));
    const venueList = managedVenueDetails
      .filter((venue) => managedVenueIds.has(venue.id))
      .map((venue) => {
      const submissionStatus = venue.submissions[0]?.status ?? null;
      return {
        id: venue.id,
        slug: venue.slug,
        name: venue.name,
        city: venue.city,
        country: venue.country,
        isPublished: venue.isPublished,
        coverUrl: resolveImageUrl(venue.featuredAsset?.url, null),
        submissionStatus,
      };
      });
    const venuePublishedCount = venueList.filter((venue) => venue.isPublished).length;
    const venueDraftCount = venueList.filter((venue) => !venue.isPublished).length;
    const venueSubmissionsPending = venueList.filter((venue) => venue.submissionStatus === "SUBMITTED").length;

    const actionInbox = [
      { id: "missing-cover", label: "Artworks missing cover", count: missingCoverCount, href: "/my/artwork?filter=missingCover", severity: "warn" as const },
      { id: "artwork-drafts", label: "Draft artworks", count: artworkDraftCount, href: "/my/artwork?filter=draft", severity: "info" as const },
      { id: "events-missing-venue", label: "Events missing venue", count: missingVenueCount, href: "/my/events?filter=missingVenue", severity: "warn" as const },
      { id: "event-drafts", label: "Draft events", count: draftEventCount, href: "/my/events?filter=draft", severity: "info" as const },
    ].filter((item) => item.count > 0).slice(0, 6);

    const recent = mapAuditToRecent(audits);
    const topArtworks30 = analytics.views.top30.slice(0, 5).map((item) => {
      const artwork = artworks.find((entry) => entry.id === item.artworkId);
      return {
        id: item.artworkId,
        slug: item.slug,
        title: item.title,
        coverUrl: resolveImageUrl(artwork?.featuredAsset?.url, artwork?.images[0]?.asset.url ?? null),
        views30: item.views,
      };
    });

    return NextResponse.json({
      artist: {
        id: artist.id,
        name: artist.name,
        slug: artist.slug,
        avatarUrl: resolveImageUrl(artist.featuredAsset?.url, artist.avatarImageUrl),
      },
      stats: {
        artworks: {
          total: artworks.length,
          published: publishedArtworkCount,
          drafts: artworkDraftCount,
          missingCover: missingCoverCount,
        },
        events: {
          total: events.length,
          upcoming30: upcomingEvents.length,
          drafts: draftEventCount,
          missingVenue: missingVenueCount,
          nextEvent: upcomingEvents[0]
            ? {
              id: upcomingEvents[0].id,
              title: upcomingEvents[0].title,
              startAtISO: upcomingEvents[0].startAt.toISOString(),
              venueName: upcomingEvents[0].venue?.name ?? null,
            }
            : undefined,
        },
        venues: {
          totalManaged: venueList.length,
          published: venuePublishedCount,
          drafts: venueDraftCount,
          submissionsPending: venueSubmissionsPending,
        },
        views: {
          last7: analytics.views.last7,
          last30: analytics.views.last30,
          last90: analytics.views.last90,
        },
        profile: getProfileCompleteness(artist, publishedArtworkCount),
      },
      actionInbox,
      topArtworks30,
      entities: {
        venues: venueList,
      },
      recent: recent.length > 0 ? recent : synthesizeRecent(artworks, events),
      links: {
        addArtworkHref: "/my/artwork/new",
        addEventHref: "/my/events/new",
        analyticsHref: "/my/analytics",
        artworksHref: "/my/artwork",
        eventsHref: "/my/events",
        artistHref: "/my/artist",
        venuesNewHref: "/my/venues/new",
        venuesHref: "/my/venues",
      },
    }, { headers: NO_STORE_HEADERS });
  } catch (error) {
    if (error instanceof Error && error.message === "unauthorized") {
      return apiError(401, "unauthorized", "Authentication required");
    }
    return apiError(500, "internal_error", "Unexpected server error");
  }
}
