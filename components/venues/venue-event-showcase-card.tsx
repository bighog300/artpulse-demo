import Link from "next/link";
import { EventCard } from "@/components/events/event-card";
import { buttonVariants } from "@/components/ui/button";
import { formatEventDateLabel, formatEventDateTimeRange } from "@/lib/dates";
import { cn } from "@/lib/utils";

export type VenueShowcaseEvent = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  startAt: Date;
  endAt: Date | null;
  imageUrl?: string | null;
  venueName: string;
};

export function VenueEventShowcaseCard({ event, calendarHref }: { event: VenueShowcaseEvent; calendarHref?: string | null }) {
  return (
    <article className="space-y-2 rounded-lg border p-3">
      <EventCard
        href={`/events/${event.slug}`}
        title={event.title}
        startAt={event.startAt}
        endAt={event.endAt}
        venueName={event.venueName}
        imageUrl={event.imageUrl}
      />
      <div className="space-y-1 px-1">
        <p className="text-sm text-foreground">{formatEventDateLabel(event.startAt)}</p>
        <p className="text-sm text-foreground">{formatEventDateTimeRange(event.startAt, event.endAt)}</p>
        {event.description ? <p className="line-clamp-3 text-sm text-muted-foreground">{event.description}</p> : null}
      </div>
      <div className="flex flex-wrap gap-2 px-1 pt-1">
        <Link href={`/events/${event.slug}`} className={cn(buttonVariants({ size: "sm" }))}>View details</Link>
        {calendarHref ? (
          <a href={calendarHref} className={cn(buttonVariants({ size: "sm", variant: "outline" }))} download>
            Add to calendar
          </a>
        ) : null}
      </div>
    </article>
  );
}
