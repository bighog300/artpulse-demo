"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SavedSearchesEmptyState } from "@/components/saved-searches/saved-searches-empty-state";
import { ErrorCard } from "@/components/ui/error-card";
import { LoadingCard } from "@/components/ui/loading-card";
import { enqueueToast } from "@/lib/toast";

type SavedSearch = { id: string; name: string; type: "NEARBY" | "EVENTS_FILTER"; frequency: "WEEKLY"; isEnabled: boolean; lastSentAt: string | null };

export function SavedSearchesClient() {
  const [items, setItems] = useState<SavedSearch[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

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

  useEffect(() => { void load(); }, []);

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

  return (
    <div className="space-y-3">
      {loadError ? <ErrorCard message={loadError} onRetry={() => void load()} /> : null}
      {isLoading ? (<div className="space-y-2" aria-busy="true"><LoadingCard lines={2} /><LoadingCard lines={2} /></div>) : null}
      {!isLoading && !loadError && items.length === 0 ? <SavedSearchesEmptyState /> : null}
      <ul className="space-y-2" aria-busy={isLoading}>
        {items.map((item) => {
          const disabled = Boolean(saving[item.id]);
          const frequency = item.isEnabled ? "WEEKLY" : "OFF";
          return (
            <li key={item.id} className="rounded border p-3">
              {renamingId === item.id ? (
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    value={renameValue}
                    onChange={(event) => setRenameValue(event.target.value)}
                    className="rounded border px-2 py-1 text-sm"
                    autoFocus
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        const next = renameValue.trim();
                        if (next.length < 2 || next.length > 60) return;
                        void patchItem(item.id, (current) => ({ ...current, name: next }), `/api/saved-searches/${item.id}/rename`, { name: next });
                        setRenamingId(null);
                      }
                      if (event.key === "Escape") {
                        setRenamingId(null);
                        setRenameValue("");
                      }
                    }}
                  />
                  <button
                    className="rounded border px-2 py-1 text-sm"
                    disabled={disabled}
                    onClick={() => {
                      const next = renameValue.trim();
                      if (next.length < 2 || next.length > 60) return;
                      void patchItem(item.id, (current) => ({ ...current, name: next }), `/api/saved-searches/${item.id}/rename`, { name: next });
                      setRenamingId(null);
                    }}
                  >Save</button>
                  <button className="rounded border px-2 py-1 text-sm" onClick={() => { setRenamingId(null); setRenameValue(""); }}>Cancel</button>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{item.name}</p>
                  <span className="rounded-full border px-2 py-0.5 text-xs">Digest: {frequency === "WEEKLY" ? "Weekly" : "Off"}</span>
                </div>
              )}

              <p className="text-xs text-gray-600">{item.type} · Last sent: {item.lastSentAt ? new Date(item.lastSentAt).toLocaleString() : "Never"}</p>

              <div className="mt-2 flex flex-wrap gap-2 text-sm">
                <button
                  className="rounded border px-2 py-1"
                  disabled={disabled}
                  onClick={() => void patchItem(item.id, (current) => ({ ...current, isEnabled: !current.isEnabled }), `/api/saved-searches/${item.id}/toggle`, { isEnabled: !item.isEnabled })}
                >{item.isEnabled ? "Disable" : "Enable"}</button>

                <select
                  className="rounded border px-2 py-1"
                  disabled={disabled}
                  value={frequency}
                  onChange={(event) => {
                    const next = event.target.value as "OFF" | "WEEKLY";
                    void patchItem(
                      item.id,
                      (current) => ({ ...current, isEnabled: next === "WEEKLY" }),
                      `/api/saved-searches/${item.id}/frequency`,
                      { frequency: next },
                    );
                  }}
                >
                  <option value="OFF">OFF</option>
                  <option value="WEEKLY">WEEKLY</option>
                </select>

                <button className="rounded border px-2 py-1" disabled={disabled} onClick={() => { setRenamingId(item.id); setRenameValue(item.name); }}>Rename</button>
                <Link href={`/saved-searches/${item.id}`} className="rounded border px-2 py-1">Run</Link>
                <button className="rounded border px-2 py-1" onClick={async () => { await fetch(`/api/saved-searches/${item.id}`, { method: "DELETE" }); await load(); }}>Delete</button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
