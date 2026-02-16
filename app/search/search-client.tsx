"use client";

import { useEffect, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { buildActiveFilterChips, deserializeFilters, serializeFilters, type SearchFilters } from "@/lib/filter-storage";

const STORAGE_KEY = "search:last-filters";

export function SearchClient({ filters }: { filters: SearchFilters }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hasParams = Array.from(searchParams?.keys() ?? []).length > 0;
    if (!hasParams) {
      const restored = deserializeFilters(window.localStorage.getItem(STORAGE_KEY));
      const keys = Object.keys(restored).filter((k) => restored[k as keyof SearchFilters]);
      if (keys.length > 0) {
        const next = new URLSearchParams();
        for (const key of keys) next.set(key, String(restored[key as keyof SearchFilters]));
        router.replace(`${pathname}?${next.toString()}`);
      }
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, serializeFilters(filters));
  }, [filters, pathname, router, searchParams]);

  const chips = useMemo(() => buildActiveFilterChips(filters), [filters]);

  const removeChip = (key: string) => {
    const next = new URLSearchParams(searchParams?.toString() ?? "");
    next.delete(key);
    router.replace(`${pathname}?${next.toString()}`);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-600">Active filters</p>
        {chips.map((chip) => (
          <button
            key={chip.key}
            type="button"
            onClick={() => removeChip(chip.key)}
            className="rounded-full border px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900"
            aria-label={`Remove ${chip.label} filter`}
          >
            {chip.label} ×
          </button>
        ))}
        {chips.length > 0 ? (
          <button
            type="button"
            className="rounded border px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900"
            onClick={() => router.replace(pathname)}
          >
            Reset filters
          </button>
        ) : null}
      </div>
    </div>
  );
}
