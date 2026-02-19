"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDebouncedValue } from "@/lib/use-debounced-value";

export type EntitySortOption = { value: string; label: string };

type EntityListControlsProps = { searchPlaceholder: string; sortOptions: EntitySortOption[] };

export function EntityListControls({ searchPlaceholder, sortOptions }: EntityListControlsProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get("q") ?? "";
  const defaultSort = sortOptions[0]?.value ?? "az";
  const sort = searchParams.get("sort") ?? defaultSort;
  const [draftQuery, setDraftQuery] = useState(query);
  const [isPending, startTransition] = useTransition();
  const debouncedQuery = useDebouncedValue(draftQuery, 180);

  const update = useCallback((updates: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (!value) next.delete(key);
      else next.set(key, value);
    });
    const queryString = next.toString();
    startTransition(() => {
      router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
    });
  }, [pathname, router, searchParams]);

  useEffect(() => {
    setDraftQuery(query);
  }, [query]);

  useEffect(() => {
    if (debouncedQuery === query) return;
    update({ q: debouncedQuery || null });
  }, [debouncedQuery, query, update]);

  const hasFilters = Boolean(query) || sort !== defaultSort;

  return (
    <div className="grid gap-2 rounded-xl border border-border bg-card p-3 md:grid-cols-[1fr_auto_auto]">
      <Input value={draftQuery} onChange={(event) => setDraftQuery(event.target.value)} placeholder={searchPlaceholder} aria-label={searchPlaceholder} className="ui-trans focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" />
      <select className="h-10 rounded-md border border-input bg-background px-3 text-sm ui-trans hover:border-ring/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" value={sort} onChange={(event) => update({ sort: event.target.value })} aria-label="Sort results">
        {sortOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
      {hasFilters ? <Button type="button" variant="ghost" className="ui-trans ui-press" onClick={() => update({ q: null, sort: null })}>Reset</Button> : <div />}
      <div className="md:col-span-3 h-4" aria-live="polite">
        {isPending ? <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><span className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" aria-hidden="true" />Updating results…</span> : null}
      </div>
    </div>
  );
}
