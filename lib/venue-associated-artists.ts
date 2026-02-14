import { resolveArtistCoverUrl, type ArtistCoverSource } from "@/lib/artists";

type BaseArtistSummary = {
  id: string;
  name: string;
  slug: string;
};

export type ArtistSummary = BaseArtistSummary & {
  coverUrl: string | null;
};

export type AssociatedArtistInput = {
  artistId: string;
  artist: BaseArtistSummary & ArtistCoverSource;
};

export function toArtistSummary(input: AssociatedArtistInput): ArtistSummary {
  return {
    id: input.artist.id,
    name: input.artist.name,
    slug: input.artist.slug,
    coverUrl: resolveArtistCoverUrl(input.artist),
  };
}

export function dedupeAssociatedArtists(verified: AssociatedArtistInput[], derived: AssociatedArtistInput[]) {
  const seen = new Set<string>();

  const uniqueArtists = (items: AssociatedArtistInput[]) => items.flatMap((item) => {
    if (seen.has(item.artistId)) return [];
    seen.add(item.artistId);
    return [toArtistSummary(item)];
  });

  return {
    verifiedArtists: uniqueArtists(verified),
    derivedArtists: uniqueArtists(derived),
  };
}
