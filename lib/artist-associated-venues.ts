import { normalizeAssociationRole, roleLabel, type AssociationRoleKey } from "@/lib/association-roles";

export type AssociatedVenue = {
  id: string;
  name: string;
  slug: string;
  roleKey: AssociationRoleKey;
  roleLabel: string;
  source: "verified" | "exhibitions";
};

type AssociatedVenueInput = { id: string; name: string; slug: string; role?: string | null };

function toVerifiedVenue(input: AssociatedVenueInput): AssociatedVenue {
  const roleKey = normalizeAssociationRole(input.role);
  return { id: input.id, name: input.name, slug: input.slug, roleKey, roleLabel: roleLabel(roleKey), source: "verified" };
}

function toDerivedVenue(input: AssociatedVenueInput): AssociatedVenue {
  const roleKey: AssociationRoleKey = "exhibited_at";
  return { id: input.id, name: input.name, slug: input.slug, roleKey, roleLabel: "Exhibition venue", source: "exhibitions" };
}

export function dedupeAssociatedVenues(verified: AssociatedVenueInput[], derived: AssociatedVenueInput[]) {
  const seen = new Set<string>();
  const uniq = (input: AssociatedVenueInput[], mapper: (item: AssociatedVenueInput) => AssociatedVenue) => input.flatMap((item) => {
    if (seen.has(item.id)) return [];
    seen.add(item.id);
    return [mapper(item)];
  });

  return {
    verified: uniq(verified, toVerifiedVenue),
    derived: uniq(derived, toDerivedVenue),
  };
}
