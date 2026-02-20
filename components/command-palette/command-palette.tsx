"use client";

import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useGetStartedState } from "@/components/onboarding/get-started-state";

type CommandPaletteProps = {
  isAuthenticated: boolean;
  isAdmin: boolean;
};

type CommandItem = {
  id: string;
  label: string;
  href: string;
  meta?: string;
};

type QuickSearchResponse = {
  events: Array<{ id: string; title: string; slug: string; startAt: string }>;
  venues: Array<{ id: string; name: string; slug: string }>;
  artists: Array<{ id: string; name: string; slug: string }>;
};

const PUBLIC_COMMANDS: CommandItem[] = [
  { id: "nav-home", label: "Home", href: "/" },
  { id: "nav-events", label: "Events", href: "/events" },
  { id: "nav-nearby", label: "Nearby", href: "/nearby" },
  { id: "nav-search", label: "Search", href: "/search" },
  { id: "nav-signin", label: "Sign in", href: "/login" },
];

const AUTH_COMMANDS: CommandItem[] = [
  { id: "nav-home", label: "Home", href: "/" },
  { id: "nav-events", label: "Events", href: "/events" },
  { id: "nav-nearby", label: "Nearby", href: "/nearby" },
  { id: "nav-search", label: "Search", href: "/search" },
  { id: "nav-for-you", label: "For You", href: "/for-you" },
  { id: "nav-following", label: "Following", href: "/following" },
  { id: "nav-notifications", label: "Notifications", href: "/notifications" },
  { id: "nav-saved", label: "Saved Searches", href: "/saved-searches" },
  { id: "nav-my-venues", label: "My Venues", href: "/my/venues" },
  { id: "nav-preferences", label: "Preferences", href: "/preferences" },
];

export function getNavigateCommands(isAuthenticated: boolean, isAdmin: boolean, showGetStarted: boolean): CommandItem[] {
  if (!isAuthenticated) return PUBLIC_COMMANDS;

  const commands = [...AUTH_COMMANDS];
  if (showGetStarted) commands.push({ id: "nav-get-started", label: "Get Started", href: "/get-started" });
  if (isAdmin) commands.push({ id: "nav-admin", label: "Admin", href: "/admin" });
  return commands;
}

function formatEventDate(startAt: string): string {
  const parsed = new Date(startAt);
  if (Number.isNaN(parsed.getTime())) return "";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(parsed);
}

export function CommandPalette({ isAuthenticated, isAdmin }: CommandPaletteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<QuickSearchResponse>({ events: [], venues: [], artists: [] });
  const [activeIndex, setActiveIndex] = useState(0);
  const [searchUnavailable, setSearchUnavailable] = useState(false);
  const { progress } = useGetStartedState();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const navigateCommands = useMemo(
    () => getNavigateCommands(isAuthenticated, isAdmin, Boolean(progress && !progress.completedAll)),
    [isAuthenticated, isAdmin, progress],
  );

  const allOptions = useMemo(() => {
    const options = [...navigateCommands];
    options.push(...results.events.map((event) => ({ id: `event-${event.id}`, label: event.title, href: `/events/${event.slug}`, meta: formatEventDate(event.startAt) })));
    options.push(...results.venues.map((venue) => ({ id: `venue-${venue.id}`, label: venue.name, href: `/venues/${venue.slug}` })));
    options.push(...results.artists.map((artist) => ({ id: `artist-${artist.id}`, label: artist.name, href: `/artists/${artist.slug}` })));
    return options;
  }, [navigateCommands, results]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isOpen) return;
    inputRef.current?.focus();

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (panelRef.current?.contains(target)) return;
      setIsOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    setActiveIndex(0);
  }, [isOpen, query, results]);

  useEffect(() => {
    if (!isOpen) return;
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults({ events: [], venues: [], artists: [] });
      setSearchUnavailable(false);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/search/quick?q=${encodeURIComponent(trimmed)}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) {
          setSearchUnavailable(true);
          setResults({ events: [], venues: [], artists: [] });
          return;
        }
        const payload = (await response.json()) as QuickSearchResponse;
        setResults(payload);
        setSearchUnavailable(false);
      } catch {
        if (!controller.signal.aborted) setSearchUnavailable(true);
      }
    }, 250);

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [isOpen, query]);

  const onInputKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((prev) => (prev + 1) % Math.max(allOptions.length, 1));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((prev) => (prev - 1 + Math.max(allOptions.length, 1)) % Math.max(allOptions.length, 1));
      return;
    }

    if (event.key === "Enter") {
      const selected = allOptions[activeIndex];
      if (!selected) return;
      event.preventDefault();
      setIsOpen(false);
      router.push(selected.href);
    }
  };

  return (
    <>
      <button type="button" className="fixed bottom-24 right-4 z-30 rounded border bg-card px-3 py-1.5 text-xs text-muted-foreground shadow md:bottom-4" onClick={() => setIsOpen(true)}>
        ⌘K
      </button>
      {isOpen ? (
        <div className="fixed inset-0 z-40 bg-black/40 px-4 py-10" role="dialog" aria-modal="true" aria-label="Command palette">
          <div ref={panelRef} className="mx-auto max-w-2xl rounded-lg border bg-card shadow-xl">
            <div className="border-b p-3">
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={onInputKeyDown}
                placeholder="Search venues, artists, and events..."
                className="w-full rounded border px-3 py-2 text-sm outline-none ring-ring focus:ring"
              />
            </div>
            <div className="max-h-[65vh] overflow-auto p-3" role="listbox" aria-activedescendant={allOptions[activeIndex]?.id}>
              <p className="px-2 pb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Navigate</p>
              {navigateCommands.map((item, index) => (
                <Link
                  key={item.id}
                  id={item.id}
                  href={item.href}
                  role="option"
                  aria-selected={activeIndex === index}
                  className={`flex items-center justify-between rounded px-2 py-1.5 text-sm ${activeIndex === index ? "bg-muted" : "hover:bg-muted/50"}`}
                  onClick={() => setIsOpen(false)}
                >
                  <span>{item.label}</span>
                  {item.meta ? <span className="text-xs text-muted-foreground">{item.meta}</span> : null}
                </Link>
              ))}

              {results.events.length > 0 ? <p className="px-2 pb-1 pt-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Events</p> : null}
              {results.events.map((item, index) => {
                const optionIndex = navigateCommands.length + index;
                return (
                  <Link
                    key={`event-${item.id}`}
                    id={`event-${item.id}`}
                    href={`/events/${item.slug}`}
                    role="option"
                    aria-selected={activeIndex === optionIndex}
                    className={`flex items-center justify-between rounded px-2 py-1.5 text-sm ${activeIndex === optionIndex ? "bg-muted" : "hover:bg-muted/50"}`}
                    onClick={() => setIsOpen(false)}
                  >
                    <span>{item.title}</span>
                    <span className="text-xs text-muted-foreground">{formatEventDate(item.startAt)}</span>
                  </Link>
                );
              })}

              {results.venues.length > 0 ? <p className="px-2 pb-1 pt-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Venues</p> : null}
              {results.venues.map((item, index) => {
                const optionIndex = navigateCommands.length + results.events.length + index;
                return (
                  <Link
                    key={`venue-${item.id}`}
                    id={`venue-${item.id}`}
                    href={`/venues/${item.slug}`}
                    role="option"
                    aria-selected={activeIndex === optionIndex}
                    className={`flex items-center justify-between rounded px-2 py-1.5 text-sm ${activeIndex === optionIndex ? "bg-muted" : "hover:bg-muted/50"}`}
                    onClick={() => setIsOpen(false)}
                  >
                    <span>{item.name}</span>
                  </Link>
                );
              })}

              {results.artists.length > 0 ? <p className="px-2 pb-1 pt-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Artists</p> : null}
              {results.artists.map((item, index) => {
                const optionIndex = navigateCommands.length + results.events.length + results.venues.length + index;
                return (
                  <Link
                    key={`artist-${item.id}`}
                    id={`artist-${item.id}`}
                    href={`/artists/${item.slug}`}
                    role="option"
                    aria-selected={activeIndex === optionIndex}
                    className={`flex items-center justify-between rounded px-2 py-1.5 text-sm ${activeIndex === optionIndex ? "bg-muted" : "hover:bg-muted/50"}`}
                    onClick={() => setIsOpen(false)}
                  >
                    <span>{item.name}</span>
                  </Link>
                );
              })}
              {searchUnavailable ? <p className="px-2 pt-3 text-xs text-amber-700">Search unavailable</p> : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export function CommandPaletteDialogPreview({ isOpen, isAuthenticated, isAdmin }: { isOpen: boolean; isAuthenticated: boolean; isAdmin: boolean }) {
  if (!isOpen) return <div data-testid="palette-closed" />;
  const commands = getNavigateCommands(isAuthenticated, isAdmin, true);
  return (
    <div role="dialog" aria-label="Command palette preview">
      {commands.map((item) => (
        <span key={item.id}>{item.label}</span>
      ))}
    </div>
  );
}
