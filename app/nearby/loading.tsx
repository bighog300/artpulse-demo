import { EventCardSkeleton } from "@/components/events/event-card-skeleton";

export default function Loading() {
  return (
    <main className="space-y-4 p-6" aria-busy="true">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => <EventCardSkeleton key={index} />)}
      </div>
    </main>
  );
}
