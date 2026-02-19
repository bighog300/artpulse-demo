"use client";

import { useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { buildEventQueryString } from "@/lib/events-filters";

type EventsFiltersBarProps = {
  availableTags?: string[];
  defaultSort?: "soonest" | "popular" | "nearby";
};

function dateRangeForPreset(preset: string) {
  const now = new Date();
  const from = now.toISOString().slice(0, 10);
  if (preset === "today") {
    return { from, to: from };
  }
  if (preset === "weekend") {
    const day = now.getDay();
    const toSaturday = (6 - day + 7) % 7;
    const saturday = new Date(now);
    saturday.setDate(now.getDate() + toSaturday);
    const sunday = new Date(saturday);
    sunday.setDate(saturday.getDate() + 1);
    return { from: saturday.toISOString().slice(0, 10), to: sunday.toISOString().slice(0, 10) };
  }
  if (preset === "next7") {
    const end = new Date(now);
    end.setDate(now.getDate() + 7);
    return { from, to: end.toISOString().slice(0, 10) };
  }
  return { from: "", to: "" };
}

export function EventsFiltersBar({ availableTags = [], defaultSort = "soonest" }: EventsFiltersBarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const query = searchParams?.get("query") ?? "";
  const from = searchParams?.get("from") ?? "";
  const to = searchParams?.get("to") ?? "";
  const sort = searchParams?.get("sort") ?? defaultSort;
  const tags = (searchParams?.get("tags") ?? "").split(",").filter(Boolean);

  const datePreset = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    if (from === today && to === today) return "today";
    return "all";
  }, [from, to]);

  const hasFilters = Boolean(query || from || to || tags.length || sort !== defaultSort);

  const updateQuery = (updates: Record<string, string | null>) => {
    const next = buildEventQueryString(searchParams, updates);
    startTransition(() => {
      router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
    });
  };

  const toggleTag = (tag: string) => {
    const nextTags = tags.includes(tag) ? tags.filter((entry) => entry !== tag) : [...tags, tag];
    updateQuery({ tags: nextTags.length ? nextTags.join(",") : null });
  };

  const bar = (
    <div className="space-y-3 rounded-xl border border-border bg-card p-3">
      <div className="grid gap-2 md:grid-cols-[1fr_auto_auto]">
        <Input
          value={query}
          onChange={(event) => updateQuery({ query: event.target.value || null })}
          placeholder="Search events"
          aria-label="Search events"
          className="ui-trans focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
        <select
          className="h-10 rounded-md border border-input bg-background px-3 text-sm ui-trans hover:border-ring/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          value={sort}
          onChange={(event) => updateQuery({ sort: event.target.value || null })}
          aria-label="Sort events"
        >
          <option value="soonest">Soonest</option>
          <option value="popular">Popular</option>
          <option value="nearby">Nearby</option>
        </select>
        {hasFilters ? <Button type="button" variant="ghost" className="ui-trans ui-press" onClick={() => updateQuery({ query: null, from: null, to: null, tags: null, sort: null })}>Clear</Button> : null}
      </div>

      <Tabs value={datePreset} onValueChange={(value) => {
        const range = dateRangeForPreset(value);
        updateQuery({ from: range.from || null, to: range.to || null });
      }}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">Any day</TabsTrigger>
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="weekend">This weekend</TabsTrigger>
          <TabsTrigger value="next7">Next 7 days</TabsTrigger>
        </TabsList>
      </Tabs>

      {availableTags.length ? (
        <div className="flex flex-wrap gap-2">
          {availableTags.slice(0, 8).map((tag) => (
            <Button key={tag} type="button" size="sm" className={`ui-trans ui-press focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${tags.includes(tag) ? "shadow-sm" : ""}`} variant={tags.includes(tag) ? "default" : "outline"} onClick={() => toggleTag(tag)} aria-label={`Filter by tag ${tag}`}>
              {tag}
            </Button>
          ))}
        </div>
      ) : null}
      <div className="h-4" aria-live="polite">
        {isPending ? <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><span className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" aria-hidden="true" />Updating filters…</span> : null}
      </div>
    </div>
  );

  return (
    <>
      <div className="md:hidden">
        <Button type="button" variant="outline" className="ui-trans ui-press" onClick={() => setIsMobileOpen((value) => !value)} aria-expanded={isMobileOpen} aria-controls="events-filters-mobile">
          Filters
        </Button>
        {isMobileOpen ? <div id="events-filters-mobile" className="mt-2">{bar}</div> : null}
      </div>
      <div className="hidden md:block">{bar}</div>
    </>
  );
}
