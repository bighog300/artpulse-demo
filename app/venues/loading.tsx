import { EntityCardSkeleton } from "@/components/entities/entity-card-skeleton";
import { PageHeader } from "@/components/ui/page-header";
import { PageShell } from "@/components/ui/page-shell";

export default function Loading() {
  return (
    <PageShell className="space-y-4">
      <PageHeader title="Venues" subtitle="Find spaces for exhibitions, performances, and shows." />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => <EntityCardSkeleton key={index} />)}
      </div>
    </PageShell>
  );
}
