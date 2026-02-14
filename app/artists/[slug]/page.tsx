import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArtistAssociatedVenuesSection } from "@/components/artists/artist-associated-venues-section";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { resolveImageUrl } from "@/lib/assets";
import { getSessionUser } from "@/lib/auth";
import { hasDatabaseUrl } from "@/lib/runtime-db";
import { FollowButton } from "@/components/follows/follow-button";
import { ShareButton } from "@/components/share-button";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { buildArtistJsonLd, getDetailUrl } from "@/lib/seo.public-profiles";
import { resolveArtistCoverUrl } from "@/lib/artists";
import { splitArtistEvents } from "@/lib/artist-events";
import { ArtistGalleryLightbox } from "@/components/artists/artist-gallery-lightbox";
import { dedupeAssociatedVenues } from "@/lib/artist-associated-venues";

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

export default async function ArtistDetail({ params }: { params: Promise<{ slug: string }> }) {
  if (!hasDatabaseUrl()) {
    return (
      <main className="p-6">
        <p>Set DATABASE_URL to view artists locally.</p>
      </main>
    );
  }

  const { slug } = await params;
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
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        where: { event: { isPublished: true } },
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
  const { upcoming, past } = splitArtistEvents(events, now);

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
      <h1 className="text-3xl font-semibold">{artist.name}</h1>
      <div className="flex flex-wrap gap-2">
        <ShareButton />
        <FollowButton
          targetType="ARTIST"
          targetId={artist.id}
          initialIsFollowing={Boolean(existingFollow)}
          initialFollowersCount={followersCount}
          isAuthenticated={Boolean(user)}
        />
      </div>
      {imageUrl ? (
        <div className="relative h-64 w-full max-w-xl overflow-hidden rounded border">
          <Image src={imageUrl} alt={artist.name} fill sizes="(max-width: 768px) 100vw, 768px" className="object-cover" />
        </div>
      ) : null}

      <section className="space-y-2">
        <h2 className="text-2xl font-semibold">About</h2>
        {artist.bio ? <p>{artist.bio}</p> : <p className="text-sm text-zinc-600">No artist statement yet.</p>}
        <div className="flex flex-wrap gap-4 text-sm">
          {artist.websiteUrl ? <a className="underline" href={artist.websiteUrl} target="_blank" rel="noreferrer">Website</a> : null}
          {artist.instagramUrl ? <a className="underline" href={artist.instagramUrl} target="_blank" rel="noreferrer">Instagram</a> : null}
        </div>
      </section>

      {galleryImages.length > 0 ? <ArtistGalleryLightbox images={galleryImages} /> : null}


      <ArtistAssociatedVenuesSection verified={associatedVenues.verified} derived={associatedVenues.derived} />

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">Upcoming exhibitions</h2>
        {upcoming.length === 0 ? <p className="rounded border border-dashed p-4 text-sm text-zinc-600">No upcoming exhibitions yet.</p> : (
          <ul className="space-y-3">
            {upcoming.map((event) => (
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

      <section className="space-y-3">
        <details className="rounded border p-4" open={past.length > 0}>
          <summary className="cursor-pointer text-xl font-semibold">Past exhibitions ({past.length})</summary>
          {past.length === 0 ? <p className="pt-3 text-sm text-zinc-600">No past exhibitions yet.</p> : (
            <ul className="space-y-3 pt-3">
              {past.map((event) => (
                <li key={event.id} className="rounded border p-3">
                  <p className="text-sm text-zinc-600">{event.startAt.toUTCString()}</p>
                  <Link href={`/events/${event.slug}`} className="text-lg font-medium underline">{event.title}</Link>
                  <p className="text-sm">Venue: {event.venueSlug ? <Link href={`/venues/${event.venueSlug}`} className="underline">{event.venueName}</Link> : event.venueName}</p>
                </li>
              ))}
            </ul>
          )}
        </details>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </main>
  );
}
