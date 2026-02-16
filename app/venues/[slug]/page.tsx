import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { resolveImageUrl } from "@/lib/assets";
import { getVenueDescriptionExcerpt, resolveVenueCoverUrl } from "@/lib/venues";
import { getSessionUser } from "@/lib/auth";
import { hasDatabaseUrl } from "@/lib/runtime-db";
import { FollowButton } from "@/components/follows/follow-button";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShareButton } from "@/components/share-button";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { buildVenueJsonLd, getDetailUrl } from "@/lib/seo.public-profiles";
import { resolveVenueGalleryAltText } from "@/lib/venue-gallery";
import { splitVenueEvents } from "@/lib/venue-events";
import { VenueEventShowcaseCard } from "@/components/venues/venue-event-showcase-card";
import { VenueGalleryLightbox } from "@/components/venues/venue-gallery-lightbox";
import { VenuePastEventsList } from "@/components/venues/venue-past-events-list";
import { dedupeAssociatedArtists } from "@/lib/venue-associated-artists";
import { VenueArtistsSection } from "@/components/venues/venue-artists-section";
import { VenueHero } from "@/components/venues/venue-hero";
import { RoleBadge } from "@/components/venues/role-badge";
import { UpcomingEventsPreview } from "@/components/venues/upcoming-events-preview";

const INITIAL_PAST_EVENTS = 6;
const MAX_PAST_EVENTS = 12;
const MAX_UPCOMING_EVENTS = 24;
const UPCOMING_PREVIEW_LIMIT = 5;

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;

  if (!hasDatabaseUrl()) {
    return {
      title: "Venue | Artpulse",
      description: "Discover venue details and upcoming events on Artpulse.",
    };
  }

  try {
    const venue = await db.venue.findFirst({
      where: { slug, isPublished: true },
      select: { name: true, description: true, featuredImageUrl: true, featuredAsset: { select: { url: true } } },
    });

    if (!venue) {
      return {
        title: "Venue | Artpulse",
        description: "Discover venue details and upcoming events on Artpulse.",
      };
    }

    const imageUrl = resolveVenueCoverUrl(venue);
    return {
      title: `${venue.name} | Artpulse`,
      description: getVenueDescriptionExcerpt(venue.description, `Explore ${venue.name} on Artpulse.`),
      openGraph: {
        title: `${venue.name} | Artpulse`,
        description: getVenueDescriptionExcerpt(venue.description, `Explore ${venue.name} on Artpulse.`),
        images: imageUrl ? [{ url: imageUrl, alt: venue.name }] : undefined,
      },
    };
  } catch {
    return {
      title: "Venue | Artpulse",
      description: "Discover venue details and upcoming events on Artpulse.",
    };
  }
}

export default async function VenueDetail({ params }: { params: Promise<{ slug: string }> }) {
  if (!hasDatabaseUrl()) {
    return (
      <main className="p-6">
        <p>Set DATABASE_URL to view events locally.</p>
      </main>
    );
  }

  const { slug } = await params;
  const now = new Date();
  const user = await getSessionUser();
  const venue = await db.venue.findFirst({
    where: { slug, isPublished: true },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      websiteUrl: true,
      addressLine1: true,
      city: true,
      region: true,
      country: true,
      featuredImageUrl: true,
      featuredAsset: { select: { url: true, width: true, height: true, alt: true } },
      images: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          url: true,
          alt: true,
          sortOrder: true,
          asset: { select: { url: true, width: true, height: true, alt: true } },
        },
      },
      memberships: user ? {
        where: { userId: user.id },
        take: 1,
        select: { role: true },
      } : undefined,
      artistAssociations: {
        where: { status: "APPROVED", artist: { isPublished: true } },
        orderBy: [{ createdAt: "desc" }, { artistId: "asc" }],
        select: {
          artistId: true,
          role: true,
          artist: {
            select: {
              id: true,
              name: true,
              slug: true,
              featuredImageUrl: true,
              avatarImageUrl: true,
              featuredAsset: { select: { url: true } },
              images: {
                take: 1,
                orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
                select: { url: true, asset: { select: { url: true } } },
              },
            },
          },
        },
      },
    },
  });

  if (!venue) notFound();

  const [followersCount, existingFollow] = await Promise.all([
    db.follow.count({ where: { targetType: "VENUE", targetId: venue.id } }),
    user ? db.follow.findUnique({ where: { userId_targetType_targetId: { userId: user.id, targetType: "VENUE", targetId: venue.id } }, select: { id: true } }) : Promise.resolve(null),
  ]);

  const featuredImageUrl = resolveImageUrl(venue.featuredAsset?.url, venue.featuredImageUrl);

  const galleryImages = venue.images.flatMap((image) => {
    const src = resolveImageUrl(image.asset?.url, image.url);
    if (!src) {
      return [];
    }

    return [{
      id: image.id,
      src,
      width: image.asset?.width,
      height: image.asset?.height,
      alt: resolveVenueGalleryAltText({ imageAlt: image.alt, assetAlt: image.asset?.alt, venueName: venue.name }),
    }];
  });

  const [upcomingEventsQuery, pastEventsQuery] = await Promise.all([
    db.event.findMany({
      where: { venueId: venue.id, isPublished: true, startAt: { gte: now } },
      orderBy: [{ startAt: "asc" }, { id: "asc" }],
      take: MAX_UPCOMING_EVENTS,
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        startAt: true,
        endAt: true,
        images: {
          take: 1,
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
          select: { url: true, asset: { select: { url: true } } },
        },
        eventArtists: {
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
          select: {
            artistId: true,
            artist: {
              select: {
                id: true,
                name: true,
                slug: true,
                featuredImageUrl: true,
                avatarImageUrl: true,
                featuredAsset: { select: { url: true } },
                images: {
                  take: 1,
                  orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
                  select: { url: true, asset: { select: { url: true } } },
                },
              },
            },
          },
          where: { artist: { isPublished: true } },
        },
      },
    }),
    db.event.findMany({
      where: { venueId: venue.id, isPublished: true, startAt: { lt: now } },
      orderBy: [{ startAt: "desc" }, { id: "desc" }],
      take: MAX_PAST_EVENTS,
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        startAt: true,
        endAt: true,
        images: {
          take: 1,
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
          select: { url: true, asset: { select: { url: true } } },
        },
        eventArtists: {
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
          select: {
            artistId: true,
            artist: {
              select: {
                id: true,
                name: true,
                slug: true,
                featuredImageUrl: true,
                avatarImageUrl: true,
                featuredAsset: { select: { url: true } },
                images: {
                  take: 1,
                  orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
                  select: { url: true, asset: { select: { url: true } } },
                },
              },
            },
          },
          where: { artist: { isPublished: true } },
        },
      },
    }),
  ]);

  const events = [...upcomingEventsQuery, ...pastEventsQuery].map((event) => ({
    ...event,
    venueName: venue.name,
    imageUrl: resolveImageUrl(event.images[0]?.asset?.url, event.images[0]?.url),
  }));

  const associatedArtists = dedupeAssociatedArtists(
    venue.artistAssociations,
    events.flatMap((event) => event.eventArtists),
  );

  const { upcoming, past } = splitVenueEvents(events, now);
  const initialPastEvents = past.slice(0, INITIAL_PAST_EVENTS);
  const hiddenPastEventsCount = Math.max(0, past.length - INITIAL_PAST_EVENTS);

  const detailUrl = getDetailUrl("venue", slug);
  const jsonLd = buildVenueJsonLd({
    name: venue.name,
    description: venue.description,
    detailUrl,
    imageUrl: featuredImageUrl,
    websiteUrl: venue.websiteUrl,
    address: venue.addressLine1,
  });

  const membershipRole = venue.memberships?.[0]?.role ?? null;
  const effectiveVenueRole = user?.role === "ADMIN" ? "ADMIN" : membershipRole;
  const canSubmitEvent = Boolean(user && (user.role === "ADMIN" || user.role === "EDITOR" || membershipRole));
  const submitHref = canSubmitEvent ? `/my/venues/${venue.id}/submit-event` : null;
  const locationText = [venue.addressLine1, venue.city, venue.region, venue.country].filter(Boolean).join(", ");
  const upcomingPreviewItems = upcoming.slice(0, UPCOMING_PREVIEW_LIMIT).map((event) => ({
    id: event.id,
    slug: event.slug,
    title: event.title,
    startAtIso: event.startAt.toISOString(),
    imageUrl: event.imageUrl ?? null,
  }));

  return (
    <main className="space-y-6 p-6">
      <Breadcrumbs items={[{ label: "Venues", href: "/venues" }, { label: venue.name, href: `/venues/${slug}` }]} />
      <VenueHero
        name={venue.name}
        imageUrl={featuredImageUrl}
        locationText={locationText || undefined}
        description={venue.description}
        followSlot={(
          <FollowButton
            targetType="VENUE"
            targetId={venue.id}
            initialIsFollowing={Boolean(existingFollow)}
            initialFollowersCount={followersCount}
            isAuthenticated={Boolean(user)}
          />
        )}
        metaSlot={
          <>
            {effectiveVenueRole ? <RoleBadge role={effectiveVenueRole} /> : null}
            <ShareButton />
          </>
        }
      />

      {canSubmitEvent ? (
        <section className="rounded-xl border bg-zinc-50 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Contributing to this venue?</h2>
              <p className="text-sm text-zinc-600">Submit a new event for editorial review.</p>
            </div>
            <Link href={submitHref!}>
              <Button>Submit Event</Button>
            </Link>
          </div>
        </section>
      ) : null}

      {galleryImages.length > 0 ? <VenueGalleryLightbox images={galleryImages} /> : null}

      <VenueArtistsSection
        verifiedArtists={associatedArtists.verifiedArtists}
        derivedArtists={associatedArtists.derivedArtists}
      />

      <UpcomingEventsPreview items={upcomingPreviewItems} viewAllHref={`/events?venue=${venue.slug}`} />

      <section className="space-y-3">
        {upcoming.length === 0 ? null : (
          <>
            <h2 className="text-2xl font-semibold">All upcoming events</h2>
            <ul className="space-y-3">
              {upcoming.map((event) => (
                <li key={event.id}>
                  <VenueEventShowcaseCard event={event} />
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <section className="space-y-3">
        <details className="rounded border p-4" open={initialPastEvents.length > 0}>
          <summary className="cursor-pointer text-xl font-semibold">Past events ({past.length})</summary>
          {initialPastEvents.length === 0 ? (
            <p className="pt-3 text-sm text-zinc-600">No past events yet.</p>
          ) : (
            <div className="space-y-3 pt-3">
              <VenuePastEventsList events={past} initialCount={INITIAL_PAST_EVENTS} />
              {hiddenPastEventsCount > 0 ? <p className="text-sm text-zinc-600">Showing up to {MAX_PAST_EVENTS} most recent past events.</p> : null}
            </div>
          )}
        </details>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </main>
  );
}
