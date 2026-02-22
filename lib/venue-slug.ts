function normalizeSlugSegment(input: string) {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export class VenueSlugExhaustedError extends Error {
  constructor(baseSlug: string, attempts: number) {
    super(`Unable to generate unique venue slug for '${baseSlug}' after ${attempts} attempts`);
    this.name = "VenueSlugExhaustedError";
  }
}

export function slugifyVenueName(name: string) {
  return normalizeSlugSegment(name);
}

export async function ensureUniqueVenueSlugWithDeps(
  deps: { findBySlug: (slug: string) => Promise<{ id: string } | null> },
  baseSlug: string,
  maxAttempts = 25,
) {
  const normalizedBase = normalizeSlugSegment(baseSlug);
  if (!normalizedBase) return null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const candidate = attempt === 1 ? normalizedBase : `${normalizedBase}-${attempt}`;
    const existing = await deps.findBySlug(candidate);
    if (!existing) return candidate;
  }

  throw new VenueSlugExhaustedError(normalizedBase, maxAttempts);
}
