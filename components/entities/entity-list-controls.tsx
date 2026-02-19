"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type EntitySortOption = { value: string; label: string };

type EntityListControlsProps = { searchPlaceholder: string; sortOptions: EntitySortOption[] };

export function EntityListControls({ searchPlaceholder, sortOptions }: EntityListControlsProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get("q") ?? "";
  const defaultSort = sortOptions[0]?.value ?? "az";
  const sort = searchParams.get("sort") ?? defaultSort;

  const update = (updates: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (!value) next.delete(key);
      else next.set(key, value);
    });
    const queryString = next.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
  };

  const hasFilters = Boolean(query) || sort !== defaultSort;

  return (
    <div className="grid gap-2 rounded-xl border border-border bg-card p-3 md:grid-cols-[1fr_auto_auto]">
      <Input value={query} onChange={(event) => update({ q: event.target.value || null })} placeholder={searchPlaceholder} aria-label={searchPlaceholder} />
      <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={sort} onChange={(event) => update({ sort: event.target.value })} aria-label="Sort results">
        {sortOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
      {hasFilters ? <Button type="button" variant="ghost" onClick={() => update({ q: null, sort: null })}>Reset</Button> : <div />}
    </div>
  );
}
