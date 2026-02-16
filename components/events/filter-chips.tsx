"use client";

import { useMemo } from "react";

type EventFilterChipsProps = {
  filters: {
    query?: string;
    tags?: string[];
    from?: string;
    to?: string;
  };
  onRemove: (updates: Record<string, string | null>) => void;
  onClearAll: () => void;
};

export function EventFilterChips({ filters, onRemove, onClearAll }: EventFilterChipsProps) {
  const activeTags = useMemo(() => (filters.tags ?? []).filter(Boolean), [filters.tags]);

  const activeFilters = useMemo(() => {
    const chips: Array<{ key: string; label: string; onRemove: () => void }> = [];
    if (filters.query) {
      chips.push({
        key: `query:${filters.query}`,
        label: `Search: ${filters.query}`,
        onRemove: () => onRemove({ query: null }),
      });
    }
    for (const tag of activeTags) {
      chips.push({
        key: `tag:${tag}`,
        label: `Tag: ${tag}`,
        onRemove: () => onRemove({ tags: activeTags.filter((item) => item !== tag).join(",") || null }),
      });
    }
    if (filters.from) {
      chips.push({
        key: `from:${filters.from}`,
        label: `From: ${filters.from}`,
        onRemove: () => onRemove({ from: null }),
      });
    }
    if (filters.to) {
      chips.push({
        key: `to:${filters.to}`,
        label: `To: ${filters.to}`,
        onRemove: () => onRemove({ to: null }),
      });
    }
    return chips;
  }, [activeTags, filters.from, filters.query, filters.to, onRemove]);

  if (!activeFilters.length) return null;

  return (
    <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1">
      {activeFilters.map((chip) => (
        <span key={chip.key} className="inline-flex shrink-0 items-center gap-2 rounded-full border bg-zinc-50 px-3 py-1 text-xs text-zinc-700">
          {chip.label}
          <button
            type="button"
            onClick={chip.onRemove}
            className="rounded px-1 leading-none hover:bg-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
            aria-label={`Remove ${chip.label}`}
          >
            ×
          </button>
        </span>
      ))}
      <button
        type="button"
        onClick={onClearAll}
        className="shrink-0 text-xs underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
      >
        Clear all
      </button>
    </div>
  );
}
