"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SavedSearchesEmptyState } from "@/components/saved-searches/saved-searches-empty-state";
import { ErrorCard } from "@/components/ui/error-card";
import { LoadingCard } from "@/components/ui/loading-card";

type SavedSearch = { id: string; name: string; type: "NEARBY" | "EVENTS_FILTER"; frequency: "WEEKLY"; isEnabled: boolean; lastSentAt: string | null };

export function SavedSearchesClient() {
  const [items, setItems] = useState<SavedSearch[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  return (
    <div className="space-y-3">
      {message ? <p className="text-sm text-gray-600">{message}</p> : null}
      {loadError ? <ErrorCard message={loadError} onRetry={() => void load()} /> : null}
      {isLoading ? (<div className="space-y-2" aria-busy="true"><LoadingCard lines={2} /><LoadingCard lines={2} /></div>) : null}
      {!isLoading && !loadError && items.length === 0 ? <SavedSearchesEmptyState /> : null}
      <ul className="space-y-2" aria-busy={isLoading}>
        {items.map((item) => (
          <li key={item.id} className="rounded border p-3">
            <p className="font-medium">{item.name}</p>
            <p className="text-xs text-gray-600">{item.type} · {item.frequency} · {item.isEnabled ? "Enabled" : "Disabled"} · Last sent: {item.lastSentAt ? new Date(item.lastSentAt).toLocaleString() : "Never"}</p>
            <div className="mt-2 flex flex-wrap gap-2 text-sm">
              <Link href={`/saved-searches/${item.id}`} className="rounded border px-2 py-1">Run now</Link>
              <button className="rounded border px-2 py-1" onClick={async () => { const next = !item.isEnabled; await fetch(`/api/saved-searches/${item.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ isEnabled: next }) }); setMessage(`Search ${next ? "enabled" : "disabled"}.`); await load(); }}>{item.isEnabled ? "Disable" : "Enable"}</button>
              <button className="rounded border px-2 py-1" onClick={async () => { const name = window.prompt("Rename saved search", item.name); if (!name) return; await fetch(`/api/saved-searches/${item.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ name }) }); setMessage("Saved search updated."); await load(); }}>Edit</button>
              <button className="rounded border px-2 py-1" onClick={async () => { await fetch(`/api/saved-searches/${item.id}`, { method: "DELETE" }); setMessage("Saved search deleted."); await load(); }}>Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
