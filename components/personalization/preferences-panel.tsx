"use client";

import { useEffect, useMemo, useState } from "react";
import { track } from "@/lib/analytics/client";
import { clearHiddenItems, getPreferenceSnapshot, removeDownrankValue, resetPersonalization } from "@/lib/personalization/preferences";

type PreferenceSnapshot = ReturnType<typeof getPreferenceSnapshot>;

export function PreferencesPanel() {
  const [snapshot, setSnapshot] = useState<PreferenceSnapshot>({
    hiddenItems: [],
    downrankArtists: [],
    downrankTags: [],
    downrankVenues: [],
    feedbackEvents: [],
  });

  const reload = () => setSnapshot(getPreferenceSnapshot());

  useEffect(() => {
    reload();
    track("preferences_panel_opened", { source: "preferences" });
  }, []);

  const hiddenCount = snapshot.hiddenItems.length;
  const chips = useMemo(
    () => [
      ...snapshot.downrankArtists.map((value) => ({ kind: "Artist", key: "downrankArtists" as const, value })),
      ...snapshot.downrankVenues.map((value) => ({ kind: "Venue", key: "downrankVenues" as const, value })),
      ...snapshot.downrankTags.map((value) => ({ kind: "Tag", key: "downrankTags" as const, value })),
    ],
    [snapshot],
  );

  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <h2 className="text-lg font-semibold">Content controls</h2>
      <p className="mt-1 text-sm text-muted-foreground">Fine-tune recommendation signals. Changes are local to this browser.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <span className="rounded-full border border-border px-2 py-1 text-xs">Hidden items: {hiddenCount}</span>
        <button className="rounded border border-border px-2 py-1 text-xs hover:bg-muted" onClick={() => { clearHiddenItems(); reload(); }}>Clear hidden</button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {chips.length === 0 ? <p className="text-xs text-muted-foreground">No “show less” preferences yet.</p> : null}
        {chips.map((chip) => (
          <button
            type="button"
            key={`${chip.key}-${chip.value}`}
            className="rounded-full border border-border px-2 py-1 text-xs hover:bg-muted"
            onClick={() => {
              removeDownrankValue(chip.key, chip.value);
              reload();
            }}
            aria-label={`Remove ${chip.kind} preference ${chip.value}`}
          >
            {chip.kind}: {chip.value} ×
          </button>
        ))}
      </div>
      <div className="mt-4">
        <button
          type="button"
          className="rounded border border-red-300 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50"
          onClick={() => {
            resetPersonalization();
            reload();
            track("preferences_reset_clicked", { source: "preferences" });
          }}
        >
          Reset personalization
        </button>
      </div>
    </section>
  );
}
