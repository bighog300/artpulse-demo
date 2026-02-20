"use client";

import { useEffect, useMemo, useState } from "react";
import { EventCard } from "@/components/events/event-card";
import { ItemActionsMenu } from "@/components/personalization/item-actions-menu";
import { WhyThis } from "@/components/personalization/why-this";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorCard } from "@/components/ui/error-card";
import { LoadingCard } from "@/components/ui/loading-card";
import { buildExplanation } from "@/lib/personalization/explanations";
import { applyDownrankSort, filterHidden } from "@/lib/personalization/preferences";
import { getOnboardingSignals, type OnboardingSignals } from "@/lib/onboarding/signals";

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

const emptySignals: OnboardingSignals = {
  followsCount: 0,
  followedArtistSlugs: [],
  followedVenueSlugs: [],
  followedArtistNames: [],
  followedVenueNames: [],
  savedEventsCount: 0,
  savedSearchesCount: 0,
  hasLocation: false,
};

export function ForYouClient() {
  const [data, setData] = useState<ForYouResponse>({ windowDays: 7, items: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);
  const [signals, setSignals] = useState<OnboardingSignals>(emptySignals);

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

  useEffect(() => {
    void load();
    void getOnboardingSignals().then((next) => setSignals(next));
  }, []);

  const items = useMemo(() => {
    const visible = data.items.filter((item) => !hiddenIds.includes(item.event.id));
    const filtered = filterHidden(visible.map((item) => ({ ...item, id: item.event.id, slug: item.event.slug, venueSlug: item.event.venue?.slug ?? undefined })), "event");
    return applyDownrankSort(filtered);
  }, [data.items, hiddenIds]);

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
      {!isLoading && !error && items.length === 0 ? (
        <EmptyState
          title="Nothing to show—try clearing preferences"
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
          {items.map((item) => {
            const explanation = buildExplanation({
              item: {
                id: item.event.id,
                slug: item.event.slug,
                title: item.event.title,
                source: "recommendations",
                venueSlug: item.event.venue?.slug,
                venueName: item.event.venue?.name,
              },
              contextSignals: { ...signals, source: "recommendations", pathname: "/for-you" },
            });

            return (
              <article className="space-y-2" key={item.event.id}>
                <EventCard
                  href={`/events/${item.event.slug}`}
                  title={item.event.title}
                  startAt={item.event.startAt}
                  venueName={item.event.venue?.name}
                  venueSlug={item.event.venue?.slug}
                  badges={item.reasons.slice(0, 2)}
                  secondaryText={`Score: ${item.score.toFixed(2)}`}
                  action={<ItemActionsMenu type="event" idOrSlug={item.event.id} source="for_you" explanation={explanation} onHidden={() => setHiddenIds((current) => [...current, item.event.id])} />}
                />
                {explanation ? <WhyThis source="for_you" explanation={explanation} /> : null}
              </article>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
