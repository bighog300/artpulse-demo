"use client";

import Link from "next/link";
import { useState } from "react";
import { ErrorCard } from "@/components/ui/error-card";
import { LoadingCard } from "@/components/ui/loading-card";

type EventItem = { id: string; slug: string; title: string; startAt: string };

export function SavedSearchRunner({ id }: { id: string }) {
  const [items, setItems] = useState<EventItem[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runNow = async () => {
    setIsLoading(true);
    const res = await fetch(`/api/saved-searches/${id}/run?limit=20`, { cache: "no-store" });
    if (!res.ok) {
      setError("Could not run saved search.");
      setIsLoading(false);
      return;
    }
    const data = await res.json();
    setItems(data.items ?? []);
    setError(null);
    setMessage(`Loaded ${data.items?.length ?? 0} events.`);
    setIsLoading(false);
  };

  return (
    <div className="space-y-3">
      <button className="rounded border px-3 py-2 text-sm" onClick={() => void runNow()} disabled={isLoading}>{isLoading ? "Running..." : "Run now"}</button>
      {message ? <p className="text-sm text-gray-600">{message}</p> : null}
      {error ? <ErrorCard message={error} onRetry={() => void runNow()} /> : null}
      {isLoading ? <LoadingCard lines={2} /> : null}
      <ul className="space-y-2" aria-busy={isLoading}>
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
