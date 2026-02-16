import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArtistAssociatedVenuesSection } from "@/components/artists/artist-associated-venues-section";
import { ArtistEventsViewTabs } from "@/components/artists/artist-events-view-tabs";
import { ArtistGalleryLightbox } from "@/components/artists/artist-gallery-lightbox";
import { ArtistHeader } from "@/components/artists/artist-header";
import { ShareButton } from "@/components/share-button";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { resolveImageUrl } from "@/lib/assets";
import { getSessionUser } from "@/lib/auth";
import { dedupeAssociatedVenues } from "@/lib/artist-associated-venues";
import { resolveArtistCoverUrl } from "@/lib/artists";
import { db } from "@/lib/db";
import { hasDatabaseUrl } from "@/lib/runtime-db";
import { buildArtistJsonLd, getDetailUrl } from "@/lib/seo.public-profiles";

const FALLBACK_METADATA = {
  title: "Artist | Artpulse",
  description: "Browse artist profiles and related events on Artpulse.",
};

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;

  if (!hasDatabaseUrl()) return FALLBACK_METADATA;

  try {
    const artist = await db.artist.findFirst({
      where: { slug, isPublished: true },
      select: {
        name: true,
        bio: true,
        avatarImageUrl: true,
        featuredImageUrl: true,
        featuredAsset: { select: { url: true } },
        images: { take: 1, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], select: { url: true, asset: { select: { url: true } } } },
      },
    });

    if (!artist) return FALLBACK_METADATA;

    const description = (artist.bio ?? "").trim().slice(0, 160) || FALLBACK_METADATA.description;
    const imageUrl = resolveArtistCoverUrl(artist);
    return {
      title: `${artist.name} | Artpulse`,
      description,
      openGraph: {
        title: `${artist.name} | Artpulse`,
        description,
        images: imageUrl ? [{ url: imageUrl, alt: artist.name }] : undefined,
      },
    };
  } catch {
    return FALLBACK_METADATA;
  }
}

type ArtistDetailProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ArtistDetail({ params, searchParams }: ArtistDetailProps) {
  if (!hasDatabaseUrl()) {
    return (
      <main className="p-6">
        <p>Set DATABASE_URL to view artists locally.</p>
      </main>
    );
  }

  const { slug } = await params;
  const query = await searchParams;
  const rawView = Array.isArray(query.view) ? query.view[0] : query.view;
  const view = rawView === "past" ? "past" : "upcoming";
  const now = new Date();
  const user = await getSessionUser();

  const artist = await db.artist.findFirst({
    where: { slug, isPublished: true },
    select: {
      id: true,
      name: true,
      bio: true,
      websiteUrl: true,
      instagramUrl: true,
      avatarImageUrl: true,
      featuredAsset: { select: { url: true } },
      images: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        select: { id: true, url: true, alt: true, asset: { select: { url: true, alt: true } } },
      },
      venueAssociations: {
        where: { status: "APPROVED", venue: { isPublished: true } },
        select: { role: true, venue: { select: { id: true, name: true, slug: true } } },
      },
      eventArtists: {
        where: {
          event: {
            isPublished: true,
            ...(view === "past" ? { startAt: { lt: now } } : { startAt: { gte: now } }),
          },
        },
        orderBy: { event: { startAt: view === "past" ? "desc" : "asc" } },
        take: 20,
        select: {
          role: true,
          event: {
            select: {
              id: true,
              title: true,
              slug: true,
              description: true,
              startAt: true,
              endAt: true,
              venue: { select: { id: true, name: true, slug: true } },
              images: { take: 1, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], select: { url: true, asset: { select: { url: true } } } },
              eventTags: { select: { tag: { select: { slug: true } } } },
            },
          },
        },
      },
    },
  });

  if (!artist) notFound();

  const [followersCount, existingFollow] = await Promise.all([
    db.follow.count({ where: { targetType: "ARTIST", targetId: artist.id } }),
    user ? db.follow.findUnique({ where: { userId_targetType_targetId: { userId: user.id, targetType: "ARTIST", targetId: artist.id } }, select: { id: true } }) : Promise.resolve(null),
  ]);

  const imageUrl = resolveArtistCoverUrl(artist);
  const galleryImages = artist.images.flatMap((image) => {
    const src = resolveImageUrl(image.asset?.url, image.url);
    if (!src) return [];

    return [{ id: image.id, src, alt: image.alt || image.asset?.alt || `${artist.name} artwork` }];
  });

  const events = artist.eventArtists.map((row) => ({
    id: row.event.id,
    title: row.event.title,
    slug: row.event.slug,
    description: row.event.description,
    startAt: row.event.startAt,
    endAt: row.event.endAt,
    venueName: row.event.venue?.name ?? "Venue TBA",
    venueSlug: row.event.venue?.slug ?? null,
    imageUrl: resolveImageUrl(row.event.images[0]?.asset?.url, row.event.images[0]?.url),
    role: row.role,
  }));
  const artistTags = Array.from(new Set(artist.eventArtists.flatMap((row) => row.event.eventTags.map(({ tag }) => tag.slug)))).slice(0, 8);

  const verifiedVenues = artist.venueAssociations.map((row) => ({ ...row.venue, role: row.role }));
  const derivedVenues = artist.eventArtists
    .map((row) => row.event.venue)
    .filter((venue): venue is { name: string; slug: string; id: string } => Boolean(venue && venue.slug))
    .map((venue) => ({ id: venue.id, name: venue.name, slug: venue.slug }));
  const associatedVenues = dedupeAssociatedVenues(verifiedVenues, derivedVenues);

  const detailUrl = getDetailUrl("artist", slug);
  const jsonLd = buildArtistJsonLd({ name: artist.name, description: artist.bio, detailUrl, imageUrl, websiteUrl: artist.websiteUrl });

  return (
    <main className="space-y-6 p-6">
      <Breadcrumbs items={[{ label: "Artists", href: "/artists" }, { label: artist.name, href: `/artists/${slug}` }]} />
      <div className="flex flex-wrap gap-2">
        <ShareButton />
      </div>

      <ArtistHeader
        name={artist.name}
        imageUrl={imageUrl}
        bio={artist.bio}
        isFollowing={Boolean(existingFollow)}
        followerCount={followersCount}
        isAuthenticated={Boolean(user)}
        artistId={artist.id}
        tags={artistTags}
      />

      <section className="space-y-2">
        <h2 className="text-2xl font-semibold">About</h2>
        <div className="flex flex-wrap gap-4 text-sm">
          {artist.websiteUrl ? <a className="underline" href={artist.websiteUrl} target="_blank" rel="noreferrer">Website</a> : null}
          {artist.instagramUrl ? <a className="underline" href={artist.instagramUrl} target="_blank" rel="noreferrer">Instagram</a> : null}
        </div>
      </section>

      {galleryImages.length > 0 ? <ArtistGalleryLightbox images={galleryImages} /> : null}

      <ArtistAssociatedVenuesSection verified={associatedVenues.verified} derived={associatedVenues.derived} />

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-semibold">Exhibitions</h2>
          <ArtistEventsViewTabs view={view} />
        </div>
        {events.length === 0 ? <p className="rounded border border-dashed p-4 text-sm text-zinc-600">No {view} exhibitions yet.</p> : (
          <ul className="space-y-3">
            {events.map((event) => (
              <li key={event.id} className="rounded border p-3">
                <p className="text-sm text-zinc-600">{event.startAt.toUTCString()}</p>
                <Link href={`/events/${event.slug}`} className="text-lg font-medium underline">{event.title}</Link>
                {event.description ? <p className="text-sm text-zinc-700">{event.description}</p> : null}
                <p className="text-sm">Venue: {event.venueSlug ? <Link href={`/venues/${event.venueSlug}`} className="underline">{event.venueName}</Link> : event.venueName}</p>
                {event.role ? <p className="text-xs text-zinc-600">Role: {event.role}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </main>
  );
}
