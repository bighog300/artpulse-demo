import { EntityCardSkeleton } from "@/components/entities/entity-card-skeleton";
import { PageHeader } from "@/components/ui/page-header";
import { PageShell } from "@/components/ui/page-shell";

export default function Loading() {
  return (
    <PageShell className="page-stack">
      <PageHeader title="Venues" subtitle="Find spaces for exhibitions, performances, and shows." />
      <div className="card-grid">
        {Array.from({ length: 6 }).map((_, index) => <EntityCardSkeleton key={index} />)}
      </div>
    </PageShell>
  );
}
