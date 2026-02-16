"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { buildEventQueryString } from "@/lib/events-filters";
import { Button } from "@/components/ui/button";

export type CalendarScope = "all" | "following" | "saved";

const SCOPES: Array<{ value: CalendarScope; label: string }> = [
  { value: "all", label: "All Events" },
  { value: "following", label: "Following" },
  { value: "saved", label: "Saved" },
];

export function parseCalendarScope(value: string | null | undefined): CalendarScope {
  return value === "following" || value === "saved" ? value : "all";
}

export function CalendarScopeToggle({ scope }: { scope: CalendarScope }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const onSelect = (nextScope: CalendarScope) => {
    const next = buildEventQueryString(searchParams, { scope: nextScope === "all" ? null : nextScope });
    router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
  };

  return (
    <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Calendar scope">
      {SCOPES.map((item) => (
        <Button
          key={item.value}
          type="button"
          size="sm"
          variant={scope === item.value ? "default" : "outline"}
          role="tab"
          aria-selected={scope === item.value}
          onClick={() => onSelect(item.value)}
          className="focus-visible:ring-2 focus-visible:ring-zinc-900"
        >
          {item.label}
        </Button>
      ))}
    </div>
  );
}
