"use client";

import { useState } from "react";
import { TASTE_STORAGE_KEY } from "@/lib/personalization/taste";
import { clearMeasurementData, getCurrentMetrics, getRecentExposures, getRecentOutcomes } from "@/lib/personalization/measurement";
import { getPersonalizationTuning, TUNING_OVERRIDE_KEY } from "@/lib/personalization/tuning";

function clearTasteModel() {
  try {
    window.localStorage.removeItem(TASTE_STORAGE_KEY);
  } catch {
    // ignore
  }
}

function clearOverrides() {
  try {
    window.localStorage.removeItem(TUNING_OVERRIDE_KEY);
  } catch {
    // ignore
  }
}

export function PersonalizationLabClient() {
  const [, setRefresh] = useState(0);
  const [raw, setRaw] = useState(() => {
    try {
      return window.localStorage.getItem(TUNING_OVERRIDE_KEY) ?? "{}";
    } catch {
      return "{}";
    }
  });

  const tuning = getPersonalizationTuning();
  const exposures = getRecentExposures(50);
  const outcomes = getRecentOutcomes(50);
  const metrics = getCurrentMetrics();

  return (
    <main className="mx-auto max-w-4xl space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Personalization Lab</h1>
      <section className="space-y-2 rounded border p-3">
        <h2 className="font-medium">Current tuning</h2>
        <pre className="overflow-auto rounded bg-muted p-2 text-xs">{JSON.stringify(tuning, null, 2)}</pre>
      </section>

      <section className="space-y-2 rounded border p-3">
        <h2 className="font-medium">Overrides ({TUNING_OVERRIDE_KEY})</h2>
        <textarea className="h-40 w-full rounded border p-2 font-mono text-xs" value={raw} onChange={(event) => setRaw(event.target.value)} />
        <button
          type="button"
          className="rounded border px-3 py-1 text-sm"
          onClick={() => {
            try {
              JSON.parse(raw);
              window.localStorage.setItem(TUNING_OVERRIDE_KEY, raw);
              setRefresh((current) => current + 1);
            } catch {
              // ignore malformed JSON
            }
          }}
        >
          Save overrides
        </button>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded border p-3">
          <h2 className="font-medium">Last 50 exposures</h2>
          <pre className="max-h-72 overflow-auto rounded bg-muted p-2 text-xs">{JSON.stringify(exposures, null, 2)}</pre>
        </div>
        <div className="rounded border p-3">
          <h2 className="font-medium">Last 50 outcomes</h2>
          <pre className="max-h-72 overflow-auto rounded bg-muted p-2 text-xs">{JSON.stringify(outcomes, null, 2)}</pre>
        </div>
      </section>

      <section className="space-y-2 rounded border p-3">
        <h2 className="font-medium">Session metrics</h2>
        <pre className="overflow-auto rounded bg-muted p-2 text-xs">{JSON.stringify(metrics, null, 2)}</pre>
      </section>

      <section className="flex flex-wrap gap-2">
        <button type="button" className="rounded border px-3 py-1 text-sm" onClick={() => { clearTasteModel(); setRefresh((current) => current + 1); }}>Clear taste model</button>
        <button type="button" className="rounded border px-3 py-1 text-sm" onClick={() => { clearMeasurementData(); setRefresh((current) => current + 1); }}>Clear exposures/outcomes/metrics</button>
        <button type="button" className="rounded border px-3 py-1 text-sm" onClick={() => { clearOverrides(); setRaw("{}"); setRefresh((current) => current + 1); }}>Clear overrides</button>
      </section>
    </main>
  );
}
