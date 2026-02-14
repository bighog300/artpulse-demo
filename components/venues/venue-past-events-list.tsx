"use client";

import { useState } from "react";
import { VenueEventShowcaseCard, type VenueShowcaseEvent } from "@/components/venues/venue-event-showcase-card";
import { Button } from "@/components/ui/button";

export function VenuePastEventsList({ events, initialCount }: { events: VenueShowcaseEvent[]; initialCount: number }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const visible = isExpanded ? events : events.slice(0, initialCount);

  return (
    <div className="space-y-3">
      <ul className="space-y-3">
        {visible.map((event) => (
          <li key={event.id}>
            <VenueEventShowcaseCard event={event} />
          </li>
        ))}
      </ul>
      {events.length > initialCount ? (
        <Button type="button" variant="outline" size="sm" onClick={() => setIsExpanded((v) => !v)}>
          {isExpanded ? "Show fewer past events" : `Load ${events.length - initialCount} more past events`}
        </Button>
      ) : null}
    </div>
  );
}
