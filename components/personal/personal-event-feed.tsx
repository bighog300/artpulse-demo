"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { EventCard } from "@/components/events/event-card";
import { ItemActionsMenu } from "@/components/personalization/item-actions-menu";
import { WhyThis } from "@/components/personalization/why-this";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { buildExplanation } from "@/lib/personalization/explanations";
import { applyDownrankSort, filterHidden } from "@/lib/personalization/preferences";
import { getOnboardingSignals, type OnboardingSignals } from "@/lib/onboarding/signals";

type FeedItem = {
  id: string;
  slug: string;
  title: string;
  startAt: Date;
  endAt: Date | null;
  venue?: { name: string | null; slug: string | null } | null;
};

const FEED_OPTIONS = [
  { value: "7", label: "Upcoming" },
  { value: "3", label: "This weekend" },
  { value: "30", label: "Newly added" },
] as const;

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

export function PersonalEventFeed({
  items,
  selectedDays,
  selectedType,
  hasNoFollows,
}: {
  items: FeedItem[];
  selectedDays: "7" | "30";
  selectedType: "both" | "artist" | "venue";
  hasNoFollows: boolean;
}) {
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);
  const [signals, setSignals] = useState<OnboardingSignals>(emptySignals);

  useEffect(() => {
    void getOnboardingSignals().then((next) => setSignals(next));
  }, []);

  const visibleItems = useMemo(() => {
    const visible = items.filter((item) => !hiddenIds.includes(item.id));
    const filtered = filterHidden(visible.map((item) => ({ ...item, id: item.id, slug: item.slug, venueSlug: item.venue?.slug ?? undefined })), "event");
    return applyDownrankSort(filtered);
  }, [items, hiddenIds]);

  if (hasNoFollows) {
    return (
      <EmptyState
        title="Start following to unlock your feed"
        description="Follow a few to populate your feed."
        actions={[{ label: "Follow artists", href: "/artists", variant: "secondary" }, { label: "Follow venues", href: "/venues", variant: "secondary" }]}
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {FEED_OPTIONS.map((option) => {
          const params = new URLSearchParams({ days: option.value === "3" ? "7" : option.value, type: selectedType });
          return (
            <Button key={option.value} asChild variant={selectedDays === params.get("days") ? "default" : "outline"} size="sm">
              <Link href={`/following?${params.toString()}`}>{option.label}</Link>
            </Button>
          );
        })}
      </div>
      {visibleItems.length === 0 ? (
        <EmptyState
          title="Nothing to show—try clearing preferences"
          description="Try broadening your timeframe, or follow more artists and venues."
          actions={[{ label: "Expand to 30 days", href: `/following?days=30&type=${selectedType}` }, { label: "Explore events", href: "/events", variant: "secondary" }]}
        />
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visibleItems.slice(0, 9).map((item) => {
            const explanation = buildExplanation({
              item: {
                id: item.id,
                slug: item.slug,
                title: item.title,
                venueSlug: item.venue?.slug,
                venueName: item.venue?.name,
                source: "following",
              },
              contextSignals: { ...signals, source: "following", pathname: "/following" },
            });
            return (
              <li key={item.id} className="space-y-2">
                <EventCard
                  href={`/events/${item.slug}`}
                  title={item.title}
                  startAt={item.startAt}
                  endAt={item.endAt}
                  venueName={item.venue?.name ?? undefined}
                  action={<ItemActionsMenu type="event" idOrSlug={item.id} source="following" explanation={explanation} onHidden={() => setHiddenIds((current) => [...current, item.id])} />}
                />
                {explanation ? <WhyThis source="following" explanation={explanation} /> : null}
              </li>
            );
          })}
        </ul>
      )}
      {visibleItems.length > 9 ? <Link href={`/following?days=${selectedDays}&type=${selectedType}`} className="text-sm font-medium underline">See all events ({visibleItems.length})</Link> : null}
    </div>
  );
}
