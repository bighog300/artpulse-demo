"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { EventCard } from "@/components/events/event-card";
import { SaveEventButton } from "@/components/events/save-event-button";
import { EventCardSkeleton } from "@/components/events/event-card-skeleton";
import { FeedToggle } from "@/components/events/feed-toggle";
import { TrendingEvents } from "@/components/events/trending-events";
import { RecommendedEvents } from "@/components/events/recommended-events";
import { EventFilterChips } from "@/components/events/filter-chips";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorCard } from "@/components/ui/error-card";
import { InlineBanner } from "@/components/ui/inline-banner";
import { Section } from "@/components/ui/section";
import { buildEventQueryString, isValidDateInput, normalizeQuery, normalizeTags, parseEventFilters } from "@/lib/events-filters";
import type { UiFixtureEvent } from "@/lib/ui-fixtures";

type EventListItem = {
  id: string;
  slug: string;
  title: string;
  startAt: string;
  endAt?: string | null;
  venue?: { id?: string; name?: string | null } | null;
  tags?: Array<{ slug: string }>;
  artistIds?: string[];
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

type FollowManageData = {
  artists: Array<{ id: string }>;
  venues: Array<{ id: string }>;
};

const EVENT_LIMIT = 24;

export function EventsClient({ isAuthenticated, fixtureItems }: { isAuthenticated: boolean; fixtureItems?: UiFixtureEvent[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters = parseEventFilters(searchParams);
  const feedParam = filters.feed;
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
  const [isLoading, setIsLoading] = useState(!fixtureItems);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [followedArtistIds, setFollowedArtistIds] = useState<Set<string>>(new Set());
  const [followedVenueIds, setFollowedVenueIds] = useState<Set<string>>(new Set());

  const latestFetchIdRef = useRef(0);

  useEffect(() => {
    if (fixtureItems) {
      setItems(fixtureItems);
      setNextCursor(null);
      setIsLoading(false);
    }
  }, [fixtureItems]);

  useEffect(() => {
    setQueryInput(queryParam);
    setTagsInput(tagsParam);
    setFromInput(fromParam);
    setToInput(toParam);
  }, [fromParam, queryParam, tagsParam, toParam]);

  useEffect(() => {
    if (!isAuthenticated) {
      setFollowedArtistIds(new Set());
      setFollowedVenueIds(new Set());
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/api/follows/manage", { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as FollowManageData;
        if (cancelled) return;
        setFollowedArtistIds(new Set((data.artists ?? []).map((artist) => artist.id)));
        setFollowedVenueIds(new Set((data.venues ?? []).map((venue) => venue.id)));
      } catch {
        if (cancelled) return;
        setFollowedArtistIds(new Set());
        setFollowedVenueIds(new Set());
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

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
      const nextValue = normalizeTags(tagsInput);
      if (nextValue === tagsParam) return;
      replaceSearch({ tags: nextValue || null });
    }, 450);
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
      if (fixtureItems) return;
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
      params.delete("feed");
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
    [fixtureItems, searchParams],
  );

  useEffect(() => {
    void fetchEvents(null);
  }, [fetchEvents]);

  const activeTags = useMemo(
    () => tagsParam.split(",").map((tag) => tag.trim()).filter(Boolean),
    [tagsParam],
  );

  const filteredItems = useMemo(() => {
    if (feedParam !== "mine") return items;
    return items.filter((event) => {
      const venueMatch = Boolean(event.venue?.id && followedVenueIds.has(event.venue.id));
      const artistMatch = (event.artistIds ?? []).some((artistId) => followedArtistIds.has(artistId));
      return venueMatch || artistMatch;
    });
  }, [feedParam, followedArtistIds, followedVenueIds, items]);

  const hasFollows = followedArtistIds.size > 0 || followedVenueIds.size > 0;
  const loadedCountLabel = nextCursor ? `${filteredItems.length}+ events` : `${filteredItems.length} events`;

  const contextParts = useMemo(() => {
    const parts: string[] = [];
    parts.push(feedParam === "mine" ? "My feed" : "All events");
    if (queryParam) parts.push(`Results for “${queryParam}”`);
    if (activeTags.length) parts.push(`Tagged: ${activeTags.join(", ")}`);
    if (fromParam || toParam) {
      const start = fromParam || "any date";
      const end = toParam || "any date";
      parts.push(`Between ${start} and ${end}`);
    }
    return parts;
  }, [activeTags, feedParam, fromParam, queryParam, toParam]);

  return (
    <section className="space-y-4">
      <InlineBanner>
        Looking for something local? <Link className="underline" href="/nearby">Find events near you</Link>. Manage <Link className="underline" href="/saved-searches">saved searches</Link>.
      </InlineBanner>

      {feedParam === "all" ? (
        <Section title="Trending" subtitle="What audiences are bookmarking and viewing this week.">
          <TrendingEvents />
        </Section>
      ) : null}

      {isAuthenticated && feedParam === "mine" && hasFollows ? (
        <Section title="For you" subtitle="Based on artists and venues you follow.">
          <RecommendedEvents enabled excludeEventIds={filteredItems.map((event) => event.id)} />
        </Section>
      ) : null}

      <Section
        title="All events"
        subtitle="Filter upcoming events by text, tags, and date range."
        actions={<Link className="text-sm underline" href={`/calendar${searchParams?.toString() ? `?${searchParams.toString()}` : ""}`}>Go to Calendar</Link>}
      >
        <div className="rounded-lg border bg-zinc-50 p-3">
          <div className="mb-3 flex items-center justify-between gap-3">
            <FeedToggle
              value={feedParam}
              disabledMine={!isAuthenticated}
              onChange={(nextFeed) => replaceSearch({ feed: nextFeed === "all" ? null : nextFeed })}
            />
            {!isAuthenticated ? <p className="text-xs text-zinc-600">Sign in to unlock My Feed.</p> : null}
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1 text-sm"><span className="font-medium text-zinc-800">Search</span><input value={queryInput} onChange={(event) => setQueryInput(event.target.value)} placeholder="Search events" className="w-full rounded border px-3 py-2" /></label>
            <label className="space-y-1 text-sm"><span className="font-medium text-zinc-800">Tags (comma-separated)</span><input value={tagsInput} onChange={(event) => setTagsInput(event.target.value)} placeholder="music,nightlife" className="w-full rounded border px-3 py-2" /></label>
            <label className="space-y-1 text-sm"><span className="font-medium text-zinc-800">From</span><input type="date" value={fromInput} onChange={(event) => setFromInput(event.target.value)} onBlur={(event) => commitDate("from", event.target.value)} className="w-full rounded border px-3 py-2" /></label>
            <label className="space-y-1 text-sm"><span className="font-medium text-zinc-800">To</span><input type="date" value={toInput} onChange={(event) => setToInput(event.target.value)} onBlur={(event) => commitDate("to", event.target.value)} className="w-full rounded border px-3 py-2" /></label>
          </div>

          <EventFilterChips
            filters={{ query: queryParam, tags: activeTags, from: fromParam, to: toParam }}
            onRemove={replaceSearch}
            onClearAll={() => replaceSearch({ query: null, tags: null, from: null, to: null })}
          />
        </div>

        <InlineBanner>
          <p>{contextParts.length ? `${contextParts.join(" · ")} · ` : "Viewing upcoming events · "}<span className="font-medium text-zinc-900">Showing {loadedCountLabel}</span></p>
        </InlineBanner>

        {error ? <ErrorCard message={error} onRetry={() => void fetchEvents(null)} /> : null}

        {isLoading ? (
          <ul className="space-y-2" aria-busy="true" aria-live="polite">
            {Array.from({ length: 5 }).map((_, index) => (<li key={`event-skeleton-${index}`}><EventCardSkeleton /></li>))}
          </ul>
        ) : null}

        {!isLoading && !error && filteredItems.length === 0 ? (
          <EmptyState
            title={feedParam === "mine" ? "Your feed is empty" : "No events match these filters"}
            description={feedParam === "mine" ? "Follow artists or venues to populate your feed." : "Try broadening your criteria or explore nearby events."}
            actions={[
              { label: "Browse Nearby", href: "/nearby", variant: "secondary" },
              ...(isAuthenticated ? [{ label: "Manage follows", href: "/following", variant: "secondary" as const }] : []),
              ...(!isAuthenticated ? [{ label: "Sign in", href: "/login", variant: "secondary" as const }] : []),
            ]}
          >
            <div className="flex flex-wrap gap-2">
              {queryParam ? <Button type="button" variant="outline" size="sm" onClick={() => replaceSearch({ query: null })}>Try clearing your search</Button> : null}
              {activeTags.length ? <Button type="button" variant="outline" size="sm" onClick={() => replaceSearch({ tags: null })}>Remove tag filters</Button> : null}
            </div>
          </EmptyState>
        ) : null}

        {!isLoading && filteredItems.length > 0 ? (
          <ul className="space-y-2">
            {filteredItems.map((event) => (
              <li key={event.id}>
                <EventCard
                  href={`/events/${event.slug}`}
                  title={event.title}
                  startAt={event.startAt}
                  endAt={event.endAt}
                  venueName={event.venue?.name}
                  imageUrl={event.primaryImageUrl}
                  badges={(event.tags ?? []).slice(0, 3).map((tag) => tag.slug)}
                  action={(<div onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}><SaveEventButton eventId={event.id} initialSaved={favoriteIds.has(event.id)} nextUrl={`/events?${searchParams?.toString() ?? ""}`} isAuthenticated={isAuthenticated} /></div>)}
                />
              </li>
            ))}
          </ul>
        ) : null}

        {!isLoading && !error && nextCursor ? (
          <div><Button type="button" variant="outline" onClick={() => void fetchEvents(nextCursor)} disabled={isLoadingMore}>{isLoadingMore ? "Loading..." : "Load more"}</Button></div>
        ) : null}
      </Section>
    </section>
  );
}
