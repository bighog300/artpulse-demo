import { resolveArtistCoverUrl, type ArtistCoverSource } from "@/lib/artists";
import { normalizeAssociationRole, roleLabel, type AssociationRoleKey } from "@/lib/association-roles";

type BaseArtistSummary = {
  id: string;
  name: string;
  slug: string;
};

export type ArtistSummary = BaseArtistSummary & {
  coverUrl: string | null;
  roleKey: AssociationRoleKey;
  roleLabel: string;
  source: "verified" | "exhibitions";
};

export type AssociatedArtistInput = {
  artistId: string;
  role?: string | null;
  artist: BaseArtistSummary & ArtistCoverSource;
};

function toArtistSummary(input: AssociatedArtistInput, source: "verified" | "exhibitions"): ArtistSummary {
  const roleKey = source === "verified" ? normalizeAssociationRole(input.role) : "exhibited_at";
  const resolvedRoleLabel = source === "verified" ? roleLabel(roleKey) : "From exhibitions";

  return {
    id: input.artist.id,
    name: input.artist.name,
    slug: input.artist.slug,
    coverUrl: resolveArtistCoverUrl(input.artist),
    roleKey,
    roleLabel: resolvedRoleLabel,
    source,
  };
}

export function dedupeAssociatedArtists(verified: AssociatedArtistInput[], derived: AssociatedArtistInput[]) {
  const seen = new Set<string>();

  const uniqueArtists = (items: AssociatedArtistInput[], source: "verified" | "exhibitions") => items.flatMap((item) => {
    if (seen.has(item.artistId)) return [];
    seen.add(item.artistId);
    return [toArtistSummary(item, source)];
  });

  return {
    verifiedArtists: uniqueArtists(verified, "verified"),
    derivedArtists: uniqueArtists(derived, "exhibitions"),
  };
}
