"use client";

import { useEffect, useState } from "react";
import { FeedbackButtons } from "@/components/recommendations/feedback-buttons";
import { WhyThis } from "@/components/recommendations/why-this";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorCard } from "@/components/ui/error-card";
import { LoadingCard } from "@/components/ui/loading-card";
import { EventCard } from "@/components/events/event-card";

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
            { label: "Follow 3 venues", href: "/venues", variant: "secondary" },
            { label: "Save a search", href: "/search", variant: "secondary" },
            { label: "Set your location", href: "/account", variant: "secondary" },
          ]}
        />
      ) : null}
      {!isLoading && !error ? (
        <div className="space-y-3">
          {data.items.map((item) => (
            <article className="space-y-2" key={item.event.id}>
              <EventCard
                href={`/events/${item.event.slug}`}
                title={item.event.title}
                startAt={item.event.startAt}
                venueName={item.event.venue?.name}
                venueSlug={item.event.venue?.slug}
                badges={item.reasons.slice(0, 3)}
                secondaryText={`Score: ${item.score.toFixed(2)}`}
              />
              <WhyThis reasons={item.reasons} />
              <FeedbackButtons eventId={item.event.id} surface="SEARCH" />
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
