"use client";

import { trackEngagement } from "@/lib/engagement-client";
import { EventCard } from "@/components/events/event-card";

type SearchResult = {
  id: string;
  slug: string;
  title: string;
  startAt: string;
  endAt?: string | null;
  venueName?: string | null;
  venueSlug?: string | null;
};

export function SearchResultsList({ items, query }: { items: SearchResult[]; query?: string }) {
  return (
    <ul className="space-y-2">
      {items.map((item, index) => (
        <li key={item.id} onClick={() => trackEngagement({ surface: "SEARCH", action: "CLICK", targetType: "EVENT", targetId: item.id, meta: { position: index, query: query?.slice(0, 120) } })}>
          <EventCard
            href={`/events/${item.slug}`}
            title={item.title}
            startAt={item.startAt}
            endAt={item.endAt}
            venueName={item.venueName}
            venueSlug={item.venueSlug}
          />
        </li>
      ))}
    </ul>
  );
}
