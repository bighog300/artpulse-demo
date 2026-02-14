export type ArtistCoverSource = {
  featuredAsset?: { url: string | null } | null;
  featuredImageUrl?: string | null;
  avatarImageUrl?: string | null;
  images?: Array<{ url?: string | null; asset?: { url: string | null } | null }>;
};

export function resolveArtistCoverUrl(artist: ArtistCoverSource): string | null {
  if (artist.featuredAsset?.url) return artist.featuredAsset.url;
  if (artist.featuredImageUrl) return artist.featuredImageUrl;
  if (artist.avatarImageUrl) return artist.avatarImageUrl;

  const firstImage = artist.images?.find((image) => image.asset?.url || image.url);
  return firstImage?.asset?.url || firstImage?.url || null;
}
