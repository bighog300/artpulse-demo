import { resolveImageUrl } from "@/lib/assets";

export type ArtworkCoverSource = {
  featuredAsset?: { url: string | null } | null;
  images?: Array<{ asset?: { url: string | null } | null }>;
};

export function resolveArtworkCoverUrl(artwork: ArtworkCoverSource): string | null {
  if (artwork.featuredAsset?.url) return artwork.featuredAsset.url;
  const firstImage = artwork.images?.find((image) => image.asset?.url);
  return resolveImageUrl(firstImage?.asset?.url, null);
}
