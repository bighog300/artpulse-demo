export type AssociatedVenue = { id: string; name: string; slug: string };

export function dedupeAssociatedVenues(verified: AssociatedVenue[], derived: AssociatedVenue[]) {
  const seen = new Set<string>();
  const uniq = (input: AssociatedVenue[]) => input.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });

  return {
    verified: uniq(verified),
    derived: uniq(derived),
  };
}
