import { EventCardSkeleton } from "@/components/events/event-card-skeleton";

export function PersonalFeedSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="h-8 w-24 rounded bg-muted" />
        <div className="h-8 w-24 rounded bg-muted" />
        <div className="h-8 w-24 rounded bg-muted" />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, idx) => <EventCardSkeleton key={idx} />)}
      </div>
    </div>
  );
}
