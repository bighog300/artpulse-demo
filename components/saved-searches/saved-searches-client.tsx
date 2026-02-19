"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { EventRow } from "@/components/events/event-row";
import { SavedSearchesEmptyState } from "@/components/saved-searches/saved-searches-empty-state";
import { ErrorCard } from "@/components/ui/error-card";
import { LoadingCard } from "@/components/ui/loading-card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { enqueueToast } from "@/lib/toast";

type SavedSearch = { id: string; name: string; type: "NEARBY" | "EVENTS_FILTER"; frequency: "WEEKLY"; isEnabled: boolean; lastSentAt: string | null; createdAt?: string };
type RunItem = { id: string; slug: string; title: string; startAt: string; endAt: string | null; venue: { name: string | null } | null };

function humanTypeLabel(type: SavedSearch["type"]) {
  return type === "NEARBY" ? "Nearby events" : "Search filters";
}

export function SavedSearchesClient() {
  const [items, setItems] = useState<SavedSearch[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [runMessages, setRunMessages] = useState<Record<string, string>>({});
  const [previewFor, setPreviewFor] = useState<string | null>(null);
  const [previewItems, setPreviewItems] = useState<RunItem[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    const res = await fetch("/api/saved-searches", { cache: "no-store" });
    if (!res.ok) {
      setLoadError("Unable to load saved searches right now.");
      setItems([]);
      setIsLoading(false);
      return;
    }
    const data = await res.json();
    setLoadError(null);
    setItems(data.items ?? []);
    setIsLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      const aDate = new Date(a.lastSentAt ?? a.createdAt ?? 0).getTime();
      const bDate = new Date(b.lastSentAt ?? b.createdAt ?? 0).getTime();
      return bDate - aDate;
    });
  }, [items]);

  const patchItem = async (id: string, updater: (item: SavedSearch) => SavedSearch, endpoint: string, body: unknown) => {
    const previous = items;
    setItems((current) => current.map((item) => item.id === id ? updater(item) : item));
    setSaving((current) => ({ ...current, [id]: true }));

    try {
      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error("request_failed");
    } catch {
      setItems(previous);
      enqueueToast({ title: "Unable to update saved search", variant: "error" });
    } finally {
      setSaving((current) => ({ ...current, [id]: false }));
    }
  };

  const runNow = async (id: string) => {
    setSaving((current) => ({ ...current, [id]: true }));
    setRunMessages((current) => ({ ...current, [id]: "Running now…" }));
    try {
      const response = await fetch(`/api/saved-searches/${id}/run?limit=6`, { cache: "no-store" });
      if (!response.ok) throw new Error("request_failed");
      const data = await response.json();
      setRunMessages((current) => ({ ...current, [id]: `Found ${data.items?.length ?? 0} events right now.` }));
    } catch {
      setRunMessages((current) => ({ ...current, [id]: "Unable to run this search right now." }));
    } finally {
      setSaving((current) => ({ ...current, [id]: false }));
    }
  };



  const openPreview = async (id: string) => {
    setPreviewFor(id);
    setPreviewLoading(true);
    setPreviewError(null);
    setPreviewItems([]);
    try {
      const response = await fetch(`/api/saved-searches/${id}/run?limit=12`, { cache: "no-store" });
      if (!response.ok) throw new Error("request_failed");
      const data = await response.json();
      setPreviewItems(data.items ?? []);
    } catch {
      setPreviewError("We couldn’t load your preview right now.");
    } finally {
      setPreviewLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {loadError ? <ErrorCard message={loadError} onRetry={() => void load()} /> : null}
      {isLoading ? <div className="space-y-2" aria-busy="true"><LoadingCard lines={3} /><LoadingCard lines={3} /></div> : null}
      {!isLoading && !loadError && sortedItems.length === 0 ? <SavedSearchesEmptyState /> : null}

      <ul className="space-y-3" aria-busy={isLoading}>
        {sortedItems.map((item) => {
          const disabled = Boolean(saving[item.id]);
          const frequency = item.isEnabled ? "Weekly" : "Off";
          return (
            <li key={item.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  {renamingId === item.id ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        value={renameValue}
                        onChange={(event) => setRenameValue(event.target.value)}
                        className="rounded border border-border px-2 py-1 text-sm"
                        autoFocus
                      />
                      <button className="rounded border border-border px-2 py-1 text-sm" disabled={disabled} onClick={() => {
                        const next = renameValue.trim();
                        if (next.length < 2 || next.length > 60) return;
                        void patchItem(item.id, (current) => ({ ...current, name: next }), `/api/saved-searches/${item.id}/rename`, { name: next });
                        setRenamingId(null);
                      }}>Save</button>
                      <button className="rounded border border-border px-2 py-1 text-sm" onClick={() => { setRenamingId(null); setRenameValue(""); }}>Cancel</button>
                    </div>
                  ) : (
                    <p className="text-lg font-semibold text-foreground">{item.name}</p>
                  )}
                  <p className="text-sm text-muted-foreground">{humanTypeLabel(item.type)} · Last sent {item.lastSentAt ? new Date(item.lastSentAt).toLocaleString() : "Never"}</p>
                </div>
                <span className="rounded-full border border-border px-2 py-1 text-xs font-medium" title="Frequency controls how often digest updates are generated.">
                  {frequency}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={item.isEnabled}
                    disabled={disabled}
                    onChange={() => void patchItem(item.id, (current) => ({ ...current, isEnabled: !current.isEnabled }), `/api/saved-searches/${item.id}/toggle`, { isEnabled: !item.isEnabled })}
                  />
                  Enabled
                </label>

                <select
                  className="rounded border border-border px-2 py-1 text-sm"
                  disabled={disabled}
                  value={item.isEnabled ? "WEEKLY" : "OFF"}
                  title="Choose Weekly to receive recurring digest updates, or Off to pause."
                  onChange={(event) => {
                    const next = event.target.value as "OFF" | "WEEKLY";
                    void patchItem(item.id, (current) => ({ ...current, isEnabled: next === "WEEKLY" }), `/api/saved-searches/${item.id}/frequency`, { frequency: next });
                  }}
                >
                  <option value="OFF">Off</option>
                  <option value="WEEKLY">Weekly</option>
                </select>

                <button className="rounded border border-border px-2 py-1 text-sm" onClick={() => { setRenamingId(item.id); setRenameValue(item.name); }} disabled={disabled}>Rename</button>
                <button className="rounded border border-border px-2 py-1 text-sm" onClick={() => void openPreview(item.id)} disabled={disabled}>Preview next digest</button>
                <button className="rounded border border-border px-2 py-1 text-sm" title="Run now fetches matching events immediately without changing your schedule." onClick={() => void runNow(item.id)} disabled={disabled}>Run now</button>
                <button className="rounded border border-red-300 px-2 py-1 text-sm text-red-700" onClick={async () => { await fetch(`/api/saved-searches/${item.id}`, { method: "DELETE" }); await load(); }}>Delete</button>
                <Link href={`/saved-searches/${item.id}`} className="rounded border border-border px-2 py-1 text-sm">Open</Link>
              </div>
              {runMessages[item.id] ? <p className="mt-2 text-sm text-muted-foreground">{runMessages[item.id]}</p> : null}
            </li>
          );
        })}
      </ul>

      <Dialog open={Boolean(previewFor)} onOpenChange={(isOpen) => !isOpen && setPreviewFor(null)}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto" aria-describedby="saved-search-preview-description">
          <DialogHeader>
            <DialogTitle>Next digest preview</DialogTitle>
            <DialogDescription id="saved-search-preview-description">A look at events currently matching this saved search.</DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-2">
            {previewLoading ? <LoadingCard lines={2} /> : null}
            {previewError && previewFor ? <ErrorCard message={previewError} onRetry={() => void openPreview(previewFor)} /> : null}
            {!previewLoading && !previewError && previewItems.length === 0 ? <p className="text-sm text-muted-foreground">No events match right now — your digest will send when new matches appear.</p> : null}
            <ul className="space-y-2">
              {previewItems.map((event) => (
                <li key={event.id}><EventRow href={`/events/${event.slug}`} title={event.title} startAt={event.startAt} endAt={event.endAt} venueName={event.venue?.name} /></li>
              ))}
            </ul>
          </div>
          <div className="mt-4 flex justify-end">
            <Link href="/search" className="rounded border border-border px-3 py-1.5 text-sm">Adjust search</Link>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
