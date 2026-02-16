import type { ReadonlyURLSearchParams } from "next/navigation";

export type EventFilters = {
  feed: "all" | "mine";
  query: string;
  tags: string[];
  from: string;
  to: string;
  venue: string;
  artist: string;
  lat: string;
  lng: string;
  radiusKm: string;
};

export function normalizeFeed(input: string) {
  return input === "mine" ? "mine" : "all";
}

function getParam(searchParams: URLSearchParams | ReadonlyURLSearchParams | null | undefined, key: string) {
  return searchParams?.get(key) ?? "";
}

export function normalizeQuery(input: string) {
  return input.trim().replace(/\s+/g, " ");
}

export function normalizeTags(input: string) {
  const uniqueTags = [...new Set(input.split(",").map((tag) => tag.trim()).filter(Boolean))];
  return uniqueTags.sort((a, b) => a.localeCompare(b)).join(",");
}

export function isValidDateInput(value: string) {
  if (!value) return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function parseEventFilters(searchParams: URLSearchParams | ReadonlyURLSearchParams | null | undefined): EventFilters {
  return {
    feed: normalizeFeed(getParam(searchParams, "feed")),
    query: normalizeQuery(getParam(searchParams, "query")),
    tags: normalizeTags(getParam(searchParams, "tags")).split(",").filter(Boolean),
    from: getParam(searchParams, "from"),
    to: getParam(searchParams, "to"),
    venue: getParam(searchParams, "venue"),
    artist: getParam(searchParams, "artist"),
    lat: getParam(searchParams, "lat"),
    lng: getParam(searchParams, "lng"),
    radiusKm: getParam(searchParams, "radiusKm"),
  };
}

export function buildEventQueryString(
  searchParams: URLSearchParams | ReadonlyURLSearchParams | null | undefined,
  updates: Record<string, string | null | undefined>,
) {
  const params = new URLSearchParams(searchParams?.toString() ?? "");
  for (const [key, value] of Object.entries(updates)) {
    if (!value) params.delete(key);
    else params.set(key, value);
  }
  return params.toString();
}
