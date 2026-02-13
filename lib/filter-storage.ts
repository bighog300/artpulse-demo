export type SearchFilters = {
  query?: string;
  from?: string;
  to?: string;
  days?: string;
  tags?: string;
  venue?: string;
  artist?: string;
  lat?: string;
  lng?: string;
  radiusKm?: string;
  limit?: string;
};

export function serializeFilters(filters: SearchFilters) {
  return JSON.stringify(filters);
}

export function deserializeFilters(value: string | null): SearchFilters {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value) as SearchFilters;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function buildActiveFilterChips(filters: SearchFilters) {
  return Object.entries(filters)
    .filter(([, value]) => typeof value === "string" && value.trim() !== "")
    .map(([key, value]) => ({ key, label: `${key}: ${value}` }));
}
