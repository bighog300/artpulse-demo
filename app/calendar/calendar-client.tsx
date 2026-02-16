"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorCard } from "@/components/ui/error-card";
import { CalendarScopeToggle, parseCalendarScope } from "@/components/calendar/calendar-scope-toggle";
import { EventFilterChips } from "@/components/events/filter-chips";
import { buildEventQueryString, parseEventFilters } from "@/lib/events-filters";

type CalendarItem = {
  id: string;
  title: string;
  slug: string;
  start: string;
  end: string | null;
  venue?: { id?: string | null; name?: string | null } | null;
  artistIds?: string[];
};

type EventsResponse = {
  items: CalendarItem[];
};

type FollowResponse = {
  artists?: string[];
  venues?: string[];
};

type FavoriteItem = {
  targetType: string;
  targetId: string;
};

export function CalendarClient({ isAuthenticated }: { isAuthenticated: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filters = parseEventFilters(searchParams);
  const scope = parseCalendarScope(searchParams?.get("scope"));

  const [events, setEvents] = useState<CalendarItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<{ from: string; to: string } | null>(null);
  const [followSet, setFollowSet] = useState<{ artistIds: Set<string>; venueIds: Set<string> }>({ artistIds: new Set(), venueIds: new Set() });
  const [savedSet, setSavedSet] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isAuthenticated || scope !== "following") {
      setFollowSet({ artistIds: new Set(), venueIds: new Set() });
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/api/follows", { cache: "no-store" });
        if (!response.ok) {
          if (!cancelled) setFollowSet({ artistIds: new Set(), venueIds: new Set() });
          return;
        }
        const data = (await response.json()) as FollowResponse;
        if (cancelled) return;
        setFollowSet({
          artistIds: new Set(data.artists ?? []),
          venueIds: new Set(data.venues ?? []),
        });
      } catch {
        if (!cancelled) setFollowSet({ artistIds: new Set(), venueIds: new Set() });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, scope]);

  useEffect(() => {
    if (!isAuthenticated || scope !== "saved") {
      setSavedSet(new Set());
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/api/favorites", { cache: "no-store" });
        if (!response.ok) {
          if (!cancelled) setSavedSet(new Set());
          return;
        }
        const data = (await response.json()) as { items?: FavoriteItem[] };
        if (cancelled) return;
        setSavedSet(new Set((data.items ?? []).filter((item) => item.targetType === "EVENT").map((item) => item.targetId)));
      } catch {
        if (!cancelled) setSavedSet(new Set());
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, scope]);


  const replaceSearch = useCallback(
    (updates: Record<string, string | null>) => {
      const next = buildEventQueryString(searchParams, updates);
      router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const fetchEvents = useCallback(async () => {
    if (!range) return;
    setIsLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (filters.query) params.set("query", filters.query);
    if (filters.tags.length) params.set("tags", filters.tags.join(","));
    if (filters.venue) params.set("venue", filters.venue);
    if (filters.artist) params.set("artist", filters.artist);
    if (filters.lat) params.set("lat", filters.lat);
    if (filters.lng) params.set("lng", filters.lng);
    if (filters.radiusKm) params.set("radiusKm", filters.radiusKm);
    params.set("from", filters.from || range.from);
    params.set("to", filters.to || range.to);
    params.set("limit", "200");

    try {
      const response = await fetch(`/api/events?${params.toString()}`, { cache: "no-store" });
      if (!response.ok) {
        setError("Unable to load calendar events right now.");
        setEvents([]);
        return;
      }
      const data = (await response.json()) as EventsResponse;
      setEvents(data.items ?? []);
    } catch {
      setError("Unable to load calendar events right now.");
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  }, [filters.artist, filters.from, filters.lat, filters.lng, filters.query, filters.radiusKm, filters.tags, filters.to, filters.venue, range]);

  useEffect(() => {
    void fetchEvents();
  }, [fetchEvents]);

  const filteredEvents = useMemo(() => {
    if (scope === "saved") {
      return events.filter((event) => savedSet.has(event.id));
    }
    if (scope === "following") {
      return events.filter((event) => {
        const venueId = event.venue?.id ?? null;
        if (venueId && followSet.venueIds.has(venueId)) return true;
        return (event.artistIds ?? []).some((artistId) => followSet.artistIds.has(artistId));
      });
    }
    return events;
  }, [events, followSet.artistIds, followSet.venueIds, savedSet, scope]);

  const activeTags = useMemo(() => filters.tags.map((tag) => tag.trim()).filter(Boolean), [filters.tags]);

  const hasActiveFilters = Boolean(filters.query || activeTags.length || filters.from || filters.to);

  const filtersQueryString = useMemo(
    () => buildEventQueryString(searchParams, { scope: null }),
    [searchParams],
  );

  const eventsHref = filtersQueryString ? `/events?${filtersQueryString}` : "/events";

  const emptyState = useMemo(() => {
    if (scope === "following") {
      return {
        title: "No events from accounts you follow",
        description: "Follow more artists or venues, or adjust the date range/filters to surface upcoming shows.",
        actions: [
          { label: "Manage following", href: "/following/manage" },
          { label: "Go to Events", href: eventsHref, variant: "secondary" as const },
        ],
      };
    }
    if (scope === "saved") {
      return {
        title: "No saved events in this range",
        description: "Try another date range or save events from the Events tab to see them on your calendar.",
        actions: [
          { label: "Browse Events", href: eventsHref },
        ],
      };
    }
    return {
      title: "No events match these filters",
      description: "Try broadening your filters or moving to a different date range.",
      actions: [
        { label: "Go to Events", href: eventsHref },
      ],
    };
  }, [eventsHref, scope]);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <CalendarScopeToggle scope={scope} />
        <p className="text-sm text-zinc-700">
          Need list results? <Link className="underline" href={eventsHref}>Go to Events</Link>
        </p>
      </div>

      <EventFilterChips
        filters={{ query: filters.query, tags: activeTags, from: filters.from, to: filters.to }}
        onRemove={replaceSearch}
        onClearAll={() => replaceSearch({ query: null, tags: null, from: null, to: null })}
      />

      {hasActiveFilters ? <p className="text-xs text-zinc-600">Filtered calendar view</p> : null}

      {error ? <ErrorCard message={error} onRetry={() => void fetchEvents()} /> : null}

      <div className="rounded-lg border bg-white p-2">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, listPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{ left: "prev,next today", center: "title", right: "dayGridMonth,timeGridWeek,listWeek" }}
          height="auto"
          datesSet={(info) => {
            setRange({
              from: info.startStr.slice(0, 10),
              to: info.endStr.slice(0, 10),
            });
          }}
          events={filteredEvents.map((event) => ({
            id: event.id,
            title: event.title,
            start: event.start,
            end: event.end ?? undefined,
            url: `/events/${event.slug}`,
          }))}
          eventClick={(info) => {
            info.jsEvent.preventDefault();
            if (info.event.url) router.push(info.event.url);
          }}
        />
      </div>

      {!isLoading && !error && filteredEvents.length === 0 ? (
        <EmptyState title={emptyState.title} description={emptyState.description} actions={emptyState.actions} />
      ) : null}
    </section>
  );
}
