import { EntityCardSkeleton } from "@/components/entities/entity-card-skeleton";
import { PageHeader } from "@/components/ui/page-header";
import { PageShell } from "@/components/ui/page-shell";

export default function Loading() {
  return (
    <PageShell className="space-y-4">
      <PageHeader title="Artists" subtitle="Discover artists and follow the creators you care about." />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => <EntityCardSkeleton key={index} />)}
      </div>
    </PageShell>
  );
}
