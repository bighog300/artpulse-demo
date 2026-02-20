"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { track } from "@/lib/analytics/client";
import { dismissChecklist, getChecklistDismissed, getOnboardingState } from "@/lib/onboarding/state";

type Signals = { follows: number; savedSearches: number; savedEvents: number; hasLocation: boolean };

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) return null;
    return response.json() as Promise<T>;
  } catch {
    return null;
  }
}

export function SetupChecklistCard({ page }: { page: string }) {
  const [signals, setSignals] = useState<Signals>({ follows: 0, savedSearches: 0, savedEvents: 0, hasLocation: false });
  const [dismissed, setDismissed] = useState(false);
  const [showCompleteState, setShowCompleteState] = useState(false);
  const shownRef = useRef(false);

  useEffect(() => {
    const onboarding = getOnboardingState();
    setDismissed(onboarding.dismissed || getChecklistDismissed());
    setShowCompleteState(onboarding.completed);

    let cancelled = false;
    (async () => {
      const [follows, savedSearches, favorites, location] = await Promise.all([
        fetchJson<{ counts?: { total?: number } }>("/api/follows"),
        fetchJson<{ items?: unknown[] }>("/api/saved-searches"),
        fetchJson<{ items?: Array<{ targetType?: string }> }>("/api/favorites"),
        fetchJson<{ locationLabel?: string | null; lat?: number | null; lng?: number | null }>("/api/me/location"),
      ]);
      if (cancelled) return;
      setSignals({
        follows: follows?.counts?.total ?? 0,
        savedSearches: savedSearches?.items?.length ?? 0,
        savedEvents: (favorites?.items ?? []).filter((item) => item.targetType === "EVENT").length,
        hasLocation: Boolean(location?.locationLabel) || (typeof location?.lat === "number" && typeof location?.lng === "number"),
      });
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (dismissed || shownRef.current) return;
    shownRef.current = true;
    track("setup_checklist_shown", { page });
  }, [dismissed, page]);

  if (dismissed) return null;
  if (showCompleteState) return <p className="text-xs text-muted-foreground">Setup complete ✓</p>;

  const items = [
    { id: "follow", label: `Follow 3 artists/venues (${Math.min(signals.follows, 3)}/3)`, done: signals.follows >= 3, destination: "/artists", cta: "Follow artists" },
    { id: "saved-search", label: "Save a search", done: signals.savedSearches > 0, destination: "/search", cta: "Create saved search" },
    { id: "location", label: "Enable location", done: signals.hasLocation, destination: "/nearby", cta: "Enable location" },
    { id: "saved-event", label: "Save an event", done: signals.savedEvents > 0, destination: "/events", cta: "Explore events" },
  ];

  return (
    <aside className="rounded-lg border bg-muted/50 p-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Complete your setup</h3>
        <button
          type="button"
          className="text-xs underline"
          onClick={() => {
            dismissChecklist();
            setDismissed(true);
            track("setup_checklist_dismissed");
          }}
        >
          Hide
        </button>
      </div>
      <ul className="mt-2 space-y-1.5 text-sm">
        {items.map((item) => (
          <li key={item.id} className="flex items-center justify-between gap-2">
            <span className={item.done ? "text-muted-foreground line-through" : ""}>{item.label}</span>
            {!item.done ? (
              <Link href={item.destination} className="text-xs underline" onClick={() => track("setup_checklist_item_clicked", { itemId: item.id, destination: item.destination })}>
                {item.cta}
              </Link>
            ) : (
              <span className="text-xs">✓</span>
            )}
          </li>
        ))}
      </ul>
    </aside>
  );
}
