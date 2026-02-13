"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FeedbackButtons } from "@/components/recommendations/feedback-buttons";
import { WhyThis } from "@/components/recommendations/why-this";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorCard } from "@/components/ui/error-card";
import { LoadingCard } from "@/components/ui/loading-card";

type ForYouResponse = {
  windowDays: number;
  items: Array<{
    score: number;
    reasons: string[];
    event: {
      id: string;
      title: string;
      slug: string;
      startAt: string;
      venue: { name: string; slug: string; city: string | null } | null;
    };
  }>;
};

export function ForYouClient() {
  const [data, setData] = useState<ForYouResponse>({ windowDays: 7, items: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    const response = await fetch("/api/recommendations/for-you?days=7&limit=20", { cache: "no-store" });
    if (!response.ok) {
      setError("Unable to load recommendations right now.");
      setIsLoading(false);
      return;
    }
    const nextData = (await response.json()) as ForYouResponse;
    setData(nextData);
    setError(null);
    setIsLoading(false);
  };

  useEffect(() => { void load(); }, []);

  return (
    <section className="space-y-3" aria-busy={isLoading}>
      <p className="text-sm text-gray-700">Personalized events in the next {data.windowDays} days based on your follows, saved searches, location, and recent clicks.</p>
      {error ? <ErrorCard message={error} onRetry={() => void load()} /> : null}
      {isLoading ? (
        <div className="space-y-3">
          <LoadingCard lines={4} />
          <LoadingCard lines={4} />
          <LoadingCard lines={4} />
        </div>
      ) : null}
      {!isLoading && !error && data.items.length === 0 ? (
        <EmptyState
          title="We need a little signal to personalize this"
          description="Follow a venue or artist, save a search, or set your location."
          actions={[
            { label: "Follow venues", href: "/venues", variant: "secondary" },
            { label: "Follow artists", href: "/artists", variant: "secondary" },
            { label: "Set location", href: "/account", variant: "secondary" },
            { label: "Save a search", href: "/search", variant: "secondary" },
          ]}
        />
      ) : null}
      {!isLoading && !error ? (
        <div className="space-y-3">
          {data.items.map((item) => (
            <article className="rounded border p-4" key={item.event.id}>
              <h2 className="text-lg font-semibold">{item.event.title}</h2>
              <p className="text-sm text-gray-700">{new Date(item.event.startAt).toLocaleString()} · {item.event.venue?.name ?? "Unknown venue"}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {item.reasons.slice(0, 3).map((reason) => (
                  <span key={reason} className="rounded-full bg-gray-100 px-2 py-1 text-xs">{reason}</span>
                ))}
              </div>
              <WhyThis reasons={item.reasons} />
              <p className="mt-2 text-xs text-gray-500">Score: {item.score}</p>
              <FeedbackButtons eventId={item.event.id} surface="SEARCH" />
              <Link className="mt-2 inline-block underline" href={`/events/${item.event.slug}`}>View event</Link>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
