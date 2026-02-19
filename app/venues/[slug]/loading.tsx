import { EntityHeaderSkeleton } from "@/components/entities/entity-header-skeleton";
import { EventCardSkeleton } from "@/components/events/event-card-skeleton";
import { PageShell } from "@/components/ui/page-shell";

export default function Loading() {
  return (
    <PageShell className="page-stack">
      <EntityHeaderSkeleton />
      <div className="card-grid">
        {Array.from({ length: 3 }).map((_, index) => <EventCardSkeleton key={index} />)}
      </div>
    </PageShell>
  );
}
