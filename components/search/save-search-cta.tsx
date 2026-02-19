"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { track } from "@/lib/analytics/client";
import { enqueueToast } from "@/lib/toast";

export function SaveSearchCta() {
  const params = useSearchParams();
  const [frequency, setFrequency] = useState<"WEEKLY" | "OFF">("WEEKLY");
  const [saving, setSaving] = useState(false);
  const [savedSearchId, setSavedSearchId] = useState<string | null>(null);

  const query = params.get("query") ?? "";
  const queryTrimmed = query.trim();
  const tags = (params.get("tags") ?? "").split(",").map((v) => v.trim()).filter(Boolean);
  const hasQuery = queryTrimmed.length > 0;

  const payload = useMemo(() => ({
    q: queryTrimmed || undefined,
    from: params.get("from") ?? undefined,
    to: params.get("to") ?? undefined,
    tags,
    venue: params.get("venue") ?? undefined,
    artist: params.get("artist") ?? undefined,
    lat: params.get("lat") ? Number(params.get("lat")) : undefined,
    lng: params.get("lng") ? Number(params.get("lng")) : undefined,
    radiusKm: params.get("radiusKm") ? Number(params.get("radiusKm")) : undefined,
  }), [params, queryTrimmed, tags]);

  useEffect(() => {
    if (!hasQuery) return;
    track("saved_search_cta_shown", { hasQuery: true, queryLength: queryTrimmed.length });
  }, [hasQuery, queryTrimmed.length]);

  if (!hasQuery) return null;

  const onSave = async () => {
    if (frequency === "OFF" || saving) return;
    setSaving(true);
    try {
      const response = await fetch("/api/saved-searches", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ type: "EVENTS_FILTER", name: `Search: ${queryTrimmed.slice(0, 50)}`, params: payload, frequency: "WEEKLY" }),
      });
      if (!response.ok) {
        enqueueToast({ title: "Could not save search", variant: "error" });
        return;
      }
      const saved = (await response.json()) as { id: string };
      setSavedSearchId(saved.id);
      track("saved_search_created", { method: "search_cta" });
      enqueueToast({ title: "Saved search created", variant: "success" });
    } catch {
      enqueueToast({ title: "Could not save search", variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <p className="font-medium">Save this search</p>
      <p className="text-sm text-muted-foreground">Get weekly digests for results like these.</p>
      {queryTrimmed.length > 120 ? <p className="mt-1 text-xs text-amber-700">Long query detected. We will save a shortened display name.</p> : null}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <select value={frequency} onChange={(e) => setFrequency(e.target.value as "WEEKLY" | "OFF")} className="rounded border px-2 py-1 text-sm">
          <option value="WEEKLY">Weekly</option>
          <option value="OFF">Off</option>
        </select>
        <button type="button" className="rounded border px-3 py-1 text-sm" onClick={() => void onSave()} disabled={frequency === "OFF" || saving || Boolean(savedSearchId)}>
          {savedSearchId ? "Saved ✓" : saving ? "Saving..." : "Save"}
        </button>
      </div>
      {savedSearchId ? (
        <div className="mt-2 flex flex-wrap gap-3 text-sm">
          <Link href={`/saved-searches/${savedSearchId}`} className="underline" onClick={() => track("saved_search_cta_preview_clicked", { source: "search" })}>Preview digest</Link>
          <Link href="/saved-searches" className="underline">Manage saved searches</Link>
        </div>
      ) : null}
    </div>
  );
}
