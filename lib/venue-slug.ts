function normalizeSlugSegment(input: string) {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function slugifyVenueName(name: string) {
  const normalized = normalizeSlugSegment(name);
  return normalized || "venue";
}

export async function ensureUniqueVenueSlugWithDeps(
  deps: { findBySlug: (slug: string) => Promise<{ id: string } | null> },
  baseSlug: string,
) {
  const normalizedBase = normalizeSlugSegment(baseSlug) || "venue";
  let candidate = normalizedBase;
  let suffix = 2;

  while (await deps.findBySlug(candidate)) {
    candidate = `${normalizedBase}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}
