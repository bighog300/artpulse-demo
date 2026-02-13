"use client";

import Link from "next/link";
import { useState } from "react";

type EventItem = { id: string; slug: string; title: string; startAt: string };

export function SavedSearchRunner({ id }: { id: string }) {
  const [items, setItems] = useState<EventItem[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  const runNow = async () => {
    const res = await fetch(`/api/saved-searches/${id}/run?limit=20`, { cache: "no-store" });
    if (!res.ok) {
      setMessage("Could not run saved search.");
      return;
    }
    const data = await res.json();
    setItems(data.items ?? []);
    setMessage(`Loaded ${data.items?.length ?? 0} events.`);
  };

  return (
    <div className="space-y-3">
      <button className="rounded border px-3 py-2 text-sm" onClick={() => void runNow()}>Run now</button>
      {message ? <p className="text-sm text-gray-600">{message}</p> : null}
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id} className="rounded border p-3">
            <Link href={`/events/${item.slug}`} className="font-medium underline">{item.title}</Link>
            <p className="text-xs text-gray-600">{new Date(item.startAt).toLocaleString()}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
