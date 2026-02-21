import { resolveImageUrl } from "@/lib/assets";

type ImageEntry = {
  url?: string | null;
  alt?: string | null;
  sortOrder?: number | null;
  isPrimary?: boolean | null;
  asset?: { url?: string | null } | null;
};

function toImageArray(value: unknown): ImageEntry[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is ImageEntry => Boolean(entry) && typeof entry === "object");
}

export function normalizeUrlOrNull(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.toString() : null;
  } catch {
    return null;
  }
}

export function safeParseImagesJson(value: unknown): ImageEntry[] {
  if (Array.isArray(value)) return toImageArray(value);
  if (typeof value !== "string") return [];
  const trimmed = value.trim();
  if (!trimmed) return [];
  try {
    return toImageArray(JSON.parse(trimmed));
  } catch {
    return [];
  }
}

function pickFirstUrl(images: ImageEntry[]): string | null {
  for (const image of images) {
    const resolved = resolveImageUrl(normalizeUrlOrNull(image.asset?.url), normalizeUrlOrNull(image.url));
    if (resolved) return resolved;
  }
  return null;
}

function pickRelationUrl(images: ImageEntry[]): string | null {
  if (!images.length) return null;
  const sorted = [...images].sort((a, b) => {
    if (Boolean(b.isPrimary) !== Boolean(a.isPrimary)) return Number(Boolean(b.isPrimary)) - Number(Boolean(a.isPrimary));
    const aSort = Number(a.sortOrder ?? Number.MAX_SAFE_INTEGER);
    const bSort = Number(b.sortOrder ?? Number.MAX_SAFE_INTEGER);
    return aSort - bSort;
  });

  return pickFirstUrl(sorted);
}

function getEntityImageUrl(entity: { featuredImageUrl?: string | null; images?: unknown; EventImage?: unknown; VenueImage?: unknown; ArtistImage?: unknown }) {
  const featured = normalizeUrlOrNull(entity.featuredImageUrl);
  if (featured) return featured;

  const relationImages = toImageArray(entity.EventImage ?? entity.VenueImage ?? entity.ArtistImage);
  const relationImage = pickRelationUrl(relationImages);
  if (relationImage) return relationImage;

  const jsonImages = safeParseImagesJson(entity.images);
  return pickFirstUrl(jsonImages);
}

export function getEventImageUrl(event: { featuredImageUrl?: string | null; images?: unknown; EventImage?: unknown }): string | null {
  return getEntityImageUrl(event);
}

export function getVenueImageUrl(venue: { featuredImageUrl?: string | null; images?: unknown; VenueImage?: unknown }): string | null {
  return getEntityImageUrl(venue);
}

export function getArtistImageUrl(artist: { featuredImageUrl?: string | null; images?: unknown; ArtistImage?: unknown }): string | null {
  return getEntityImageUrl(artist);
}
