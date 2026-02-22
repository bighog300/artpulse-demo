import type { ReadonlyURLSearchParams } from "next/navigation";

export type NearbyFilters = {
  q: string;
  tags: string[];
  days: 7 | 30 | 90;
  from: string;
  to: string;
  sort: "soonest" | "distance";
};

export function parseNearbyFilters(searchParams: URLSearchParams | ReadonlyURLSearchParams | null | undefined): NearbyFilters {
  const q = (searchParams?.get("q") ?? "").trim();
  const tags = Array.from(new Set((searchParams?.get("tags") ?? "").split(",").map((value) => value.trim()).filter(Boolean))).slice(0, 10);
  const from = searchParams?.get("from") ?? "";
  const to = searchParams?.get("to") ?? "";
  const rawDays = searchParams?.get("days");
  const hasRange = Boolean(from || to);
  const parsedDays = rawDays === "7" || rawDays === "30" || rawDays === "90" ? Number(rawDays) as 7 | 30 | 90 : 30;
  const days = hasRange ? 30 : parsedDays;
  const rawSort = searchParams?.get("sort");
  const sort = rawSort === "distance" ? "distance" : "soonest";
  return { q, tags, days, from, to, sort };
}

export function serializeNearbyFilters(filters: Partial<NearbyFilters>) {
  const params = new URLSearchParams();
  if (filters.q?.trim()) params.set("q", filters.q.trim());
  if (filters.tags?.length) params.set("tags", filters.tags.join(","));
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (!filters.from && !filters.to && filters.days && filters.days !== 30) params.set("days", String(filters.days));
  if (filters.sort && filters.sort !== "soonest") params.set("sort", filters.sort);
  return params;
}
