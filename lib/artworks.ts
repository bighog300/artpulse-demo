import { resolveImageUrl } from "@/lib/assets";
import { db } from "@/lib/db";

export type ArtworkCoverSource = {
  featuredAsset?: { url: string | null } | null;
  images?: Array<{ asset?: { url: string | null } | null }>;
};

export type PublishedArtworkListItem = {
  id: string;
  slug: string | null;
  title: string;
  coverUrl: string | null;
  artist: { id: string; name: string };
};

export function resolveArtworkCoverUrl(artwork: ArtworkCoverSource): string | null {
  if (artwork.featuredAsset?.url) return artwork.featuredAsset.url;
  const firstImage = artwork.images?.find((image) => image.asset?.url);
  return resolveImageUrl(firstImage?.asset?.url, null);
}

export function getArtworkPublicHref(artwork: { id: string; slug?: string | null }) {
  return `/artwork/${artwork.slug ?? artwork.id}`;
}

export function publishedArtworksByArtistWhere(artistId: string) {
  return { artistId, isPublished: true };
}

export function publishedArtworksByVenueWhere(venueId: string) {
  return { isPublished: true, venues: { some: { venueId } } };
}

export function publishedArtworksByEventWhere(eventId: string) {
  return { isPublished: true, events: { some: { eventId } } };
}


type PublishedArtworkRow = {
  id: string;
  slug: string | null;
  title: string;
  artist: { id: string; name: string };
  featuredAsset: { url: string | null } | null;
  images: Array<{ asset: { url: string | null } | null }>;
};

type ArtworkCountDeps = {
  count: (args: { where: Record<string, unknown> }) => Promise<number>;
};

function artworkCountDeps(): ArtworkCountDeps {
  return { count: (args) => db.artwork.count(args) };
}

export async function countPublishedArtworksByArtist(artistId: string, deps: ArtworkCountDeps = artworkCountDeps()) {
  return deps.count({ where: publishedArtworksByArtistWhere(artistId) });
}

export async function countPublishedArtworksByVenue(venueId: string, deps: ArtworkCountDeps = artworkCountDeps()) {
  return deps.count({ where: publishedArtworksByVenueWhere(venueId) });
}

export async function countPublishedArtworksByEvent(eventId: string, deps: ArtworkCountDeps = artworkCountDeps()) {
  return deps.count({ where: publishedArtworksByEventWhere(eventId) });
}

export async function countAllArtworksByArtist(artistId: string, deps: ArtworkCountDeps = artworkCountDeps()) {
  return deps.count({ where: { artistId } });
}

function mapPublishedArtworkRow(item: PublishedArtworkRow): PublishedArtworkListItem {
  return {
    id: item.id,
    slug: item.slug,
    title: item.title,
    artist: item.artist,
    coverUrl: resolveImageUrl(item.featuredAsset?.url, item.images[0]?.asset?.url),
  };
}

const selectRelatedArtwork = {
  id: true,
  slug: true,
  title: true,
  artist: { select: { id: true, name: true } },
  featuredAsset: { select: { url: true } },
  images: { orderBy: [{ sortOrder: "asc" as const }, { createdAt: "asc" as const }], take: 1, select: { asset: { select: { url: true } } } },
};

export async function listPublishedArtworksByArtist(artistId: string, limit = 6): Promise<PublishedArtworkListItem[]> {
  const items = await db.artwork.findMany({ where: publishedArtworksByArtistWhere(artistId), orderBy: { updatedAt: "desc" }, take: limit, select: selectRelatedArtwork });
  return items.map(mapPublishedArtworkRow);
}

export async function listPublishedArtworksByVenue(venueId: string, limit = 6): Promise<PublishedArtworkListItem[]> {
  const items = await db.artwork.findMany({ where: publishedArtworksByVenueWhere(venueId), orderBy: { updatedAt: "desc" }, take: limit, select: selectRelatedArtwork });
  return items.map(mapPublishedArtworkRow);
}

export async function listPublishedArtworksByEvent(eventId: string, limit = 6): Promise<PublishedArtworkListItem[]> {
  const items = await db.artwork.findMany({ where: publishedArtworksByEventWhere(eventId), orderBy: { updatedAt: "desc" }, take: limit, select: selectRelatedArtwork });
  return items.map(mapPublishedArtworkRow);
}
