export type VenueCoverSource = {
  featuredAsset?: { url: string | null } | null;
  featuredImageUrl?: string | null;
};

export function resolveVenueCoverUrl(venue: VenueCoverSource): string | null {
  return venue.featuredAsset?.url || venue.featuredImageUrl || null;
}

export function getVenueDescriptionExcerpt(description: string | null | undefined, fallback: string): string {
  const plain = (description ?? "").trim().replace(/\s+/g, " ");
  if (!plain) return fallback;
  return plain.length <= 160 ? plain : `${plain.slice(0, 157)}...`;
}
