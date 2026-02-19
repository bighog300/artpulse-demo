import { EventCardSkeleton } from "@/components/events/event-card-skeleton";
import { PageHeader } from "@/components/ui/page-header";
import { PageShell } from "@/components/ui/page-shell";

export default function Loading() {
  return (
    <PageShell className="page-stack" aria-busy="true">
      <PageHeader title="Events" subtitle="Discover what’s on near you" />
      <div className="card-grid">
        {Array.from({ length: 6 }).map((_, index) => <EventCardSkeleton key={index} />)}
      </div>
    </PageShell>
  );
}
