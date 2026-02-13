"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type SavedSearch = { id: string; name: string; type: "NEARBY" | "EVENTS_FILTER"; frequency: "WEEKLY"; isEnabled: boolean; lastSentAt: string | null };

export function SavedSearchesClient() {
  const [items, setItems] = useState<SavedSearch[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  const load = async () => {
    const res = await fetch("/api/saved-searches", { cache: "no-store" });
    const data = await res.json();
    setItems(data.items ?? []);
  };

  useEffect(() => { void load(); }, []);

  return (
    <div className="space-y-3">
      {message ? <p className="text-sm text-gray-600">{message}</p> : null}
      {items.length === 0 ? <p className="text-sm text-gray-700">No saved searches yet.</p> : null}
      <ul className="space-y-2">
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
