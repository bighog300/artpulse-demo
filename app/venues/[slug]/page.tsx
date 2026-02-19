import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EntityAboutCard } from "@/components/entities/entity-about-card";
import { EntityHeader } from "@/components/entities/entity-header";
import { EntityTabs } from "@/components/entities/entity-tabs";
import { EventCard } from "@/components/events/event-card";
import { FollowButton } from "@/components/follows/follow-button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageShell } from "@/components/ui/page-shell";
import { PageViewTracker } from "@/components/analytics/page-view-tracker";
import { SectionHeader } from "@/components/ui/section-header";
import { resolveImageUrl } from "@/lib/assets";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasDatabaseUrl } from "@/lib/runtime-db";
import { buildVenueJsonLd, getDetailUrl } from "@/lib/seo.public-profiles";
import { getVenueDescriptionExcerpt, resolveVenueCoverUrl } from "@/lib/venues";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  if (!hasDatabaseUrl()) return { title: "Venue | Artpulse", description: "Discover venue details and upcoming events on Artpulse." };
  const venue = await db.venue.findFirst({ where: { slug, isPublished: true }, select: { name: true, description: true, featuredImageUrl: true, featuredAsset: { select: { url: true } } } });
  if (!venue) return { title: "Venue | Artpulse", description: "Discover venue details and upcoming events on Artpulse." };
  const imageUrl = resolveVenueCoverUrl(venue);
  return { title: `${venue.name} | Artpulse`, description: getVenueDescriptionExcerpt(venue.description, `Explore ${venue.name} on Artpulse.`), openGraph: { title: `${venue.name} | Artpulse`, description: getVenueDescriptionExcerpt(venue.description, `Explore ${venue.name} on Artpulse.`), images: imageUrl ? [{ url: imageUrl, alt: venue.name }] : undefined } };
}

export default async function VenueDetail({ params }: { params: Promise<{ slug: string }> }) {
  if (!hasDatabaseUrl()) return <main className="p-6">Set DATABASE_URL to view venues locally.</main>;

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
      featuredAsset: { select: { url: true } },
      events: {
        where: { isPublished: true, startAt: { gte: now } },
        orderBy: [{ startAt: "asc" }, { id: "asc" }],
        take: 24,
        select: {
          id: true,
          title: true,
          slug: true,
          startAt: true,
          endAt: true,
          images: { take: 1, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], select: { url: true, asset: { select: { url: true } } } },
          eventTags: { select: { tag: { select: { slug: true } } } },
        },
      },
    },
  });

  if (!venue) notFound();

  const [followersCount, existingFollow] = await Promise.all([
    db.follow.count({ where: { targetType: "VENUE", targetId: venue.id } }),
    user ? db.follow.findUnique({ where: { userId_targetType_targetId: { userId: user.id, targetType: "VENUE", targetId: venue.id } }, select: { id: true } }) : Promise.resolve(null),
  ]);

  const coverUrl = resolveImageUrl(venue.featuredAsset?.url, venue.featuredImageUrl);
  const subtitle = [venue.city, venue.region, venue.country].filter(Boolean).join(", ") || "Venue profile";
  const address = [venue.addressLine1, venue.city, venue.region, venue.country].filter(Boolean).join(", ");
  const mapHref = address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}` : null;

  const events = venue.events.map((event) => ({
    id: event.id,
    title: event.title,
    slug: event.slug,
    startAt: event.startAt,
    endAt: event.endAt,
    imageUrl: resolveImageUrl(event.images[0]?.asset?.url, event.images[0]?.url),
    tags: event.eventTags.map(({ tag }) => tag.slug),
  }));

  const detailUrl = getDetailUrl("venue", slug);
  const jsonLd = buildVenueJsonLd({ name: venue.name, description: venue.description, detailUrl, imageUrl: coverUrl, websiteUrl: venue.websiteUrl, address: venue.addressLine1 });

  return (
    <PageShell className="page-stack">
      <PageViewTracker name="entity_viewed" props={{ type: "venue", slug }} />
      <EntityHeader
        title={venue.name}
        subtitle={subtitle}
        imageUrl={coverUrl}
        coverUrl={coverUrl}
        primaryAction={<FollowButton targetType="VENUE" targetId={venue.id} initialIsFollowing={Boolean(existingFollow)} initialFollowersCount={followersCount} isAuthenticated={Boolean(user)} analyticsSlug={venue.slug} />}
        secondaryAction={mapHref ? <a className="inline-flex rounded-md border px-3 py-1 text-sm" href={mapHref} target="_blank" rel="noreferrer">Open in Maps</a> : undefined}
      />

      <EntityTabs
        upcoming={(
          <section className="space-y-3">
            <SectionHeader title="Upcoming events" subtitle="What’s happening at this venue next." />
            {events.length === 0 ? <EmptyState title="No upcoming events" description="Follow this venue and check back soon." /> : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {events.map((event) => <EventCard key={event.id} href={`/events/${event.slug}`} title={event.title} startAt={event.startAt} endAt={event.endAt} venueName={venue.name} venueSlug={venue.slug} imageUrl={event.imageUrl} tags={event.tags} />)}
              </div>
            )}
          </section>
        )}
        about={<EntityAboutCard description={venue.description} websiteUrl={venue.websiteUrl} address={address || null} mapHref={mapHref} />}
      />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </PageShell>
  );
}
