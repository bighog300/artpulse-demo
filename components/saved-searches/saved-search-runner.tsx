"use client";

import { useState } from "react";
import { ErrorCard } from "@/components/ui/error-card";
import { LoadingCard } from "@/components/ui/loading-card";
import { EventCard } from "@/components/events/event-card";

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
          <li key={item.id}>
            <EventCard href={`/events/${item.slug}`} title={item.title} startAt={item.startAt} badges={["Preview"]} />
          </li>
        ))}
      </ul>
    </div>
  );
}
