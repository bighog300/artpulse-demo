import { EntityHeaderSkeleton } from "@/components/entities/entity-header-skeleton";
import { EventCardSkeleton } from "@/components/events/event-card-skeleton";
import { PageShell } from "@/components/ui/page-shell";

export default function Loading() {
  return (
    <PageShell className="space-y-6">
      <EntityHeaderSkeleton />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => <EventCardSkeleton key={index} />)}
      </div>
    </PageShell>
  );
}
