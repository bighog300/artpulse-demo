import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { resolveImageUrl } from "@/lib/assets";
import { getSessionUser } from "@/lib/auth";
import { hasDatabaseUrl } from "@/lib/runtime-db";
import { FollowButton } from "@/components/follows/follow-button";
import { ShareButton } from "@/components/share-button";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { buildDetailMetadata, buildVenueJsonLd, getDetailUrl } from "@/lib/seo.public-profiles";
import { resolveVenueGalleryAltText } from "@/lib/venue-gallery";
import { splitVenueEvents } from "@/lib/venue-events";
import { VenueEventShowcaseCard } from "@/components/venues/venue-event-showcase-card";
import { VenueGalleryLightbox } from "@/components/venues/venue-gallery-lightbox";
import { VenuePastEventsList } from "@/components/venues/venue-past-events-list";

const INITIAL_PAST_EVENTS = 6;
const MAX_PAST_EVENTS = 12;
const MAX_UPCOMING_EVENTS = 24;

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;

  if (!hasDatabaseUrl()) {
    return buildDetailMetadata({ kind: "venue", slug });
  }

  try {
    const venue = await db.venue.findFirst({ where: { slug, isPublished: true }, include: { featuredAsset: { select: { url: true } } } });
    if (!venue) {
      return buildDetailMetadata({ kind: "venue", slug });
    }
    const imageUrl = resolveImageUrl(venue.featuredAsset?.url, venue.featuredImageUrl);
    return buildDetailMetadata({ kind: "venue", slug, title: venue.name, description: venue.description, imageUrl });
  } catch {
    return buildDetailMetadata({ kind: "venue", slug });
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
      description: true,
      websiteUrl: true,
      addressLine1: true,
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
      },
    }),
  ]);

  const events = [...upcomingEventsQuery, ...pastEventsQuery].map((event) => ({
    ...event,
    venueName: venue.name,
    imageUrl: resolveImageUrl(event.images[0]?.asset?.url, event.images[0]?.url),
  }));

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

  return (
    <main className="space-y-6 p-6">
      <Breadcrumbs items={[{ label: "Venues", href: "/venues" }, { label: venue.name, href: `/venues/${slug}` }]} />
      <h1 className="text-3xl font-semibold">{venue.name}</h1>
      <ShareButton />
      <FollowButton
        targetType="VENUE"
        targetId={venue.id}
        initialIsFollowing={Boolean(existingFollow)}
        initialFollowersCount={followersCount}
        isAuthenticated={Boolean(user)}
      />
      {featuredImageUrl ? (
        <div className="relative h-64 w-full max-w-xl overflow-hidden rounded border">
          <Image src={featuredImageUrl} alt={venue.name} fill sizes="(max-width: 768px) 100vw, 768px" className="object-cover" />
        </div>
      ) : null}
      <section className="space-y-2">
        <h2 className="text-2xl font-semibold">About</h2>
        <p>{venue.description}</p>
      </section>

      {galleryImages.length > 0 ? <VenueGalleryLightbox images={galleryImages} /> : null}

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">Upcoming events</h2>
        {upcoming.length === 0 ? (
          <p className="rounded border border-dashed p-4 text-sm text-zinc-600">No upcoming events yet.</p>
        ) : (
          <ul className="space-y-3">
            {upcoming.map((event) => (
              <li key={event.id}>
                <VenueEventShowcaseCard event={event} />
              </li>
            ))}
          </ul>
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
