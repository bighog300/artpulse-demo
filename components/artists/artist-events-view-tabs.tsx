"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

type ArtistEventsView = "upcoming" | "past";

const TAB_OPTIONS: Array<{ value: ArtistEventsView; label: string }> = [
  { value: "upcoming", label: "Upcoming" },
  { value: "past", label: "Past" },
];

export function ArtistEventsViewTabs({ view }: { view: ArtistEventsView }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setView = (nextView: ArtistEventsView) => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    if (nextView === "upcoming") params.delete("view");
    else params.set("view", nextView);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  return (
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Event view tabs">
      {TAB_OPTIONS.map((tab) => {
        const isActive = tab.value === view;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => setView(tab.value)}
            className={`rounded-full border px-3 py-1 text-sm motion-safe:transition-colors motion-safe:duration-150 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${isActive ? "border-primary bg-primary text-primary-foreground" : "bg-background text-foreground hover:bg-muted/50 hover:shadow-sm"}`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
