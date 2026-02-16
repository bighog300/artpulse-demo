"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { EventCard } from "@/components/events/event-card";
import { SaveEventButton } from "@/components/events/save-event-button";
import { EventCardSkeleton } from "@/components/events/event-card-skeleton";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorCard } from "@/components/ui/error-card";
import { buildEventQueryString, isValidDateInput, normalizeQuery, normalizeTags, parseEventFilters } from "@/lib/events-filters";

type EventListItem = {
  id: string;
  slug: string;
  title: string;
  startAt: string;
  endAt?: string | null;
  venue?: { name?: string | null } | null;
  tags?: Array<{ slug: string }>;
  primaryImageUrl?: string | null;
};

type EventsResponse = {
  items: EventListItem[];
  nextCursor: string | null;
};

type FavoriteItem = {
  targetType: string;
  targetId: string;
};

const EVENT_LIMIT = 24;

export function EventsClient({ isAuthenticated }: { isAuthenticated: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters = parseEventFilters(searchParams);
  const queryParam = filters.query;
  const tagsParam = filters.tags.join(",");
  const fromParam = filters.from;
  const toParam = filters.to;

  const [queryInput, setQueryInput] = useState(queryParam);
  const [tagsInput, setTagsInput] = useState(tagsParam);
  const [fromInput, setFromInput] = useState(fromParam);
  const [toInput, setToInput] = useState(toParam);

  const [items, setItems] = useState<EventListItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  const latestFetchIdRef = useRef(0);

  useEffect(() => {
    setQueryInput(queryParam);
    setTagsInput(tagsParam);
    setFromInput(fromParam);
    setToInput(toParam);
  }, [fromParam, queryParam, tagsParam, toParam]);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;

    (async () => {
      try {
        const response = await fetch("/api/favorites", { cache: "no-store" });
        if (response.status === 401) {
          if (!cancelled) setFavoriteIds(new Set());
          return;
        }
        if (!response.ok) return;
        const data = (await response.json()) as { items?: FavoriteItem[] };
        if (cancelled) return;
        const eventIds = new Set(
          (data.items ?? [])
            .filter((item) => item.targetType === "EVENT")
            .map((item) => item.targetId),
        );
        setFavoriteIds(eventIds);
      } catch {
        if (!cancelled) setFavoriteIds(new Set());
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const replaceSearch = useCallback(
    (updates: Record<string, string | null>) => {
      const next = buildEventQueryString(searchParams, updates);
      router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const value = queryInput.trim();
      const normalized = normalizeQuery(value);
      if (normalized === queryParam) return;
      replaceSearch({ query: normalized || null });
    }, 350);

    return () => window.clearTimeout(handle);
  }, [queryInput, queryParam, replaceSearch]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const normalized = tagsInput
        ? normalizeTags(tagsInput)
        : "";
      if (normalized === tagsParam) return;
      replaceSearch({ tags: normalized || null });
    }, 350);

    return () => window.clearTimeout(handle);
  }, [replaceSearch, tagsInput, tagsParam]);

  const commitDate = useCallback(
    (key: "from" | "to", value: string) => {
      const trimmed = value.trim();
      if (!isValidDateInput(trimmed)) return;
      const current = searchParams?.get(key) ?? "";
      if (trimmed === current) return;
      replaceSearch({ [key]: trimmed || null });
    },
    [replaceSearch, searchParams],
  );

  const fetchEvents = useCallback(
    async (cursor?: string | null) => {
      const fetchId = latestFetchIdRef.current + 1;
      latestFetchIdRef.current = fetchId;
      if (cursor) setIsLoadingMore(true);
      else {
        setIsLoading(true);
        setItems([]);
      }
      setError(null);

      const params = new URLSearchParams(searchParams?.toString() ?? "");
      params.delete("cursor");
      params.set("limit", String(EVENT_LIMIT));
      if (cursor) params.set("cursor", cursor);

      try {
        const response = await fetch(`/api/events?${params.toString()}`, { cache: "no-store" });
        if (!response.ok) {
          if (latestFetchIdRef.current !== fetchId) return;
          setError("Unable to load events right now.");
          setNextCursor(null);
          return;
        }
        const data = (await response.json()) as EventsResponse;
        if (latestFetchIdRef.current !== fetchId) return;
        setItems((prev) => (cursor ? [...prev, ...data.items] : data.items));
        setNextCursor(data.nextCursor);
      } catch {
        if (latestFetchIdRef.current !== fetchId) return;
        setError("Unable to load events right now.");
        setNextCursor(null);
      } finally {
        if (latestFetchIdRef.current !== fetchId) return;
        if (cursor) setIsLoadingMore(false);
        else setIsLoading(false);
      }
    },
    [searchParams],
  );

  useEffect(() => {
    void fetchEvents(null);
  }, [fetchEvents]);

  const activeTags = useMemo(
    () => tagsParam.split(",").map((tag) => tag.trim()).filter(Boolean),
    [tagsParam],
  );

  const activeFilters = useMemo(() => {
    const chips: Array<{ key: string; label: string; onRemove: () => void }> = [];
    if (queryParam) {
      chips.push({ key: `query:${queryParam}`, label: `Search: ${queryParam}`, onRemove: () => replaceSearch({ query: null }) });
    }
    for (const tag of activeTags) {
      chips.push({
        key: `tag:${tag}`,
        label: `Tag: ${tag}`,
        onRemove: () => replaceSearch({ tags: activeTags.filter((item) => item !== tag).join(",") || null }),
      });
    }
    if (fromParam) chips.push({ key: `from:${fromParam}`, label: `From: ${fromParam}`, onRemove: () => replaceSearch({ from: null }) });
    if (toParam) chips.push({ key: `to:${toParam}`, label: `To: ${toParam}`, onRemove: () => replaceSearch({ to: null }) });
    return chips;
  }, [activeTags, fromParam, queryParam, replaceSearch, toParam]);

  const contextParts = useMemo(() => {
    const parts: string[] = [];
    if (queryParam) parts.push(`Results for “${queryParam}”`);
    if (activeTags.length) parts.push(`Tagged: ${activeTags.join(", ")}`);
    if (fromParam || toParam) {
      const start = fromParam || "any date";
      const end = toParam || "any date";
      parts.push(`Between ${start} and ${end}`);
    }
    return parts;
  }, [activeTags, fromParam, queryParam, toParam]);

  const loadedCountLabel = nextCursor ? `${items.length}+ events` : `${items.length} events`;

  return (
    <section className="space-y-4">
      <p className="text-sm text-gray-700">Looking for something local? <Link className="underline" href="/nearby">Find events near you</Link>. Manage <Link className="underline" href="/saved-searches">saved searches</Link>.</p>
      <p className="text-sm text-gray-700">Prefer a date grid? <Link className="underline" href={`/calendar${searchParams?.toString() ? `?${searchParams.toString()}` : ""}`}>Go to Calendar</Link>.</p>

      <div className="rounded-lg border bg-white p-3">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="font-medium text-zinc-800">Search</span>
            <input
              value={queryInput}
              onChange={(event) => setQueryInput(event.target.value)}
              placeholder="Search events"
              className="w-full rounded border px-3 py-2"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium text-zinc-800">Tags (comma-separated)</span>
            <input
              value={tagsInput}
              onChange={(event) => setTagsInput(event.target.value)}
              placeholder="music,nightlife"
              className="w-full rounded border px-3 py-2"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium text-zinc-800">From</span>
            <input
              type="date"
              value={fromInput}
              onChange={(event) => setFromInput(event.target.value)}
              onBlur={(event) => commitDate("from", event.target.value)}
              className="w-full rounded border px-3 py-2"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium text-zinc-800">To</span>
            <input
              type="date"
              value={toInput}
              onChange={(event) => setToInput(event.target.value)}
              onBlur={(event) => commitDate("to", event.target.value)}
              className="w-full rounded border px-3 py-2"
            />
          </label>
        </div>

        {activeFilters.length ? (
          <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1">
            {activeFilters.map((chip) => (
              <span key={chip.key} className="inline-flex shrink-0 items-center gap-2 rounded-full border bg-zinc-50 px-3 py-1 text-xs text-zinc-700">
                {chip.label}
                <button
                  type="button"
                  onClick={chip.onRemove}
                  className="rounded px-1 leading-none hover:bg-zinc-200"
                  aria-label={`Remove ${chip.label}`}
                >
                  ×
                </button>
              </span>
            ))}
            <button
              type="button"
              onClick={() => replaceSearch({ query: null, tags: null, from: null, to: null })}
              className="shrink-0 text-xs underline"
            >
              Clear all
            </button>
          </div>
        ) : null}
      </div>

      <div className="rounded-lg border bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
        <p>{contextParts.length ? `${contextParts.join(" · ")} · ` : "Viewing upcoming events · "}<span className="font-medium text-zinc-900">Showing {loadedCountLabel}</span></p>
      </div>

      {error ? <ErrorCard message={error} onRetry={() => void fetchEvents(null)} /> : null}

      {isLoading ? (
        <ul className="space-y-2" aria-busy="true" aria-live="polite">
          {Array.from({ length: 5 }).map((_, index) => (
            <li key={`event-skeleton-${index}`}>
              <EventCardSkeleton />
            </li>
          ))}
        </ul>
      ) : null}

      {!isLoading && !error && items.length === 0 ? (
        <EmptyState
          title="No events match these filters"
          description="Try broadening your criteria or explore nearby events."
          actions={[
            { label: "Browse Nearby", href: "/nearby", variant: "secondary" },
            ...(isAuthenticated ? [{ label: "Manage saved searches", href: "/saved-searches", variant: "secondary" as const }] : []),
          ]}
        >
          <div className="flex flex-wrap gap-2">
            {queryParam ? (
              <Button type="button" variant="outline" size="sm" onClick={() => replaceSearch({ query: null })}>
                Try clearing your search
              </Button>
            ) : null}
            {activeTags.length ? (
              <Button type="button" variant="outline" size="sm" onClick={() => replaceSearch({ tags: null })}>
                Remove tag filters
              </Button>
            ) : null}
          </div>
        </EmptyState>
      ) : null}

      {!isLoading && items.length > 0 ? (
        <ul className="space-y-2">
          {items.map((event) => (
            <li key={event.id}>
              <EventCard
                href={`/events/${event.slug}`}
                title={event.title}
                startAt={event.startAt}
                endAt={event.endAt}
                venueName={event.venue?.name}
                imageUrl={event.primaryImageUrl}
                badges={(event.tags ?? []).slice(0, 3).map((tag) => tag.slug)}
                action={(
                  <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                    <SaveEventButton
                      eventId={event.id}
                      initialSaved={favoriteIds.has(event.id)}
                      nextUrl={`/events?${searchParams?.toString() ?? ""}`}
                      isAuthenticated={isAuthenticated}
                    />
                  </div>
                )}
              />
            </li>
          ))}
        </ul>
      ) : null}

      {!isLoading && !error && nextCursor ? (
        <div>
          <Button type="button" variant="outline" onClick={() => void fetchEvents(nextCursor)} disabled={isLoadingMore}>
            {isLoadingMore ? "Loading..." : "Load more"}
          </Button>
        </div>
      ) : null}
    </section>
  );
}
