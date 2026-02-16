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
import { EventCard } from "@/components/events/event-card";
import { EventCardSkeleton } from "@/components/events/event-card-skeleton";
import { InlineBanner } from "@/components/ui/inline-banner";
import { Section } from "@/components/ui/section";
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

export function CalendarClient({ isAuthenticated, fixtureItems, fallbackFixtureItems }: { isAuthenticated: boolean; fixtureItems?: CalendarItem[]; fallbackFixtureItems?: CalendarItem[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filters = parseEventFilters(searchParams);
  const scope = parseCalendarScope(searchParams?.get("scope"));
  const viewMode = searchParams?.get("view") === "agenda" ? "agenda" : "calendar";

  const [events, setEvents] = useState<CalendarItem[]>(fixtureItems ?? []);
  const [isLoading, setIsLoading] = useState(!fixtureItems);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<{ from: string; to: string } | null>(null);
  const [followSet, setFollowSet] = useState<{ artistIds: Set<string>; venueIds: Set<string> }>({ artistIds: new Set(), venueIds: new Set() });
  const [savedSet, setSavedSet] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (fixtureItems) {
      setEvents(fixtureItems);
      setIsLoading(false);
    }
  }, [fixtureItems]);

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
        setFollowSet({ artistIds: new Set(data.artists ?? []), venueIds: new Set(data.venues ?? []) });
      } catch {
        if (!cancelled) setFollowSet({ artistIds: new Set(), venueIds: new Set() });
      }
    })();

    return () => { cancelled = true; };
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

    return () => { cancelled = true; };
  }, [isAuthenticated, scope]);

  const replaceSearch = useCallback(
    (updates: Record<string, string | null>) => {
      const next = buildEventQueryString(searchParams, updates);
      router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const fetchEvents = useCallback(async () => {
    if (fixtureItems || !range) return;
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
        if (fallbackFixtureItems?.length) {
          setEvents(fallbackFixtureItems);
          setError(null);
          return;
        }
        setError("Unable to load calendar events right now.");
        setEvents([]);
        return;
      }
      const data = (await response.json()) as EventsResponse;
      setEvents(data.items ?? []);
    } catch {
      if (fallbackFixtureItems?.length) {
        setEvents(fallbackFixtureItems);
        setError(null);
      } else {
        setError("Unable to load calendar events right now.");
        setEvents([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [fallbackFixtureItems, filters.artist, filters.from, filters.lat, filters.lng, filters.query, filters.radiusKm, filters.tags, filters.to, filters.venue, fixtureItems, range]);

  useEffect(() => {
    void fetchEvents();
  }, [fetchEvents]);

  const filteredEvents = useMemo(() => {
    if (scope === "saved") return events.filter((event) => savedSet.has(event.id));
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
  const filtersQueryString = useMemo(() => buildEventQueryString(searchParams, { scope: null }), [searchParams]);
  const eventsHref = filtersQueryString ? `/events?${filtersQueryString}` : "/events";

  return (
    <section className="space-y-4">
      <Section title="Controls" subtitle="Change scope, filters, and view mode.">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CalendarScopeToggle scope={scope} />
          <div className="flex items-center gap-3 text-sm text-zinc-700">
            <Link className="underline" href={eventsHref}>Go to Events</Link>
            <button type="button" className="underline" onClick={() => replaceSearch({ view: viewMode === "calendar" ? "agenda" : "calendar" })}>
              View: {viewMode === "calendar" ? "Calendar" : "Agenda"}
            </button>
          </div>
        </div>

        <EventFilterChips filters={{ query: filters.query, tags: activeTags, from: filters.from, to: filters.to }} onRemove={replaceSearch} onClearAll={() => replaceSearch({ query: null, tags: null, from: null, to: null })} />
        {hasActiveFilters ? <InlineBanner>Filtered calendar view</InlineBanner> : null}
      </Section>

      <Section title="Calendar view">
        {error ? <ErrorCard message={error} onRetry={() => void fetchEvents()} /> : null}
        <div className="rounded-lg border bg-white p-2">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, listPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{ left: "prev,next today", center: "title", right: "dayGridMonth,timeGridWeek,listWeek" }}
            height="auto"
            datesSet={(info) => setRange({ from: info.startStr.slice(0, 10), to: info.endStr.slice(0, 10) })}
            events={filteredEvents.map((event) => ({ id: event.id, title: event.title, start: event.start, end: event.end ?? undefined, url: `/events/${event.slug}` }))}
            eventClick={(info) => {
              info.jsEvent.preventDefault();
              if (info.event.url) router.push(info.event.url);
            }}
          />
        </div>

        {isLoading ? <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <EventCardSkeleton key={i} />)}</div> : null}
        {!isLoading && !error && filteredEvents.length === 0 ? <EmptyState title="No events match these filters" description="Try broadening your filters or moving to a different date range." actions={[{ label: "Go to Events", href: eventsHref }]} /> : null}
      </Section>

      {viewMode === "agenda" ? (
        <Section title="Agenda" subtitle="List view for the current filtered set.">
          {filteredEvents.length === 0 ? <EmptyState title="No agenda items" description="Switch back to calendar view or update filters." /> : (
            <ul className="space-y-2">
              {filteredEvents.map((event) => (
                <li key={`agenda-${event.id}`}><EventCard href={`/events/${event.slug}`} title={event.title} startAt={event.start} endAt={event.end} venueName={event.venue?.name ?? undefined} /></li>
              ))}
            </ul>
          )}
        </Section>
      ) : null}
    </section>
  );
}
