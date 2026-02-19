import { PageHeader } from "@/components/ui/page-header";
import { PageShell } from "@/components/ui/page-shell";

export default function Loading() {
  return (
    <PageShell className="page-stack" aria-busy="true">
      <PageHeader title="Digests" subtitle="Your personalized event roundups" />
      <div className="page-stack">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="rounded-2xl border border-border bg-card p-5">
            <div className="h-5 w-40 animate-pulse rounded bg-muted" />
            <div className="mt-2 h-8 w-64 animate-pulse rounded bg-muted" />
            <div className="mt-2 h-4 w-48 animate-pulse rounded bg-muted" />
            <div className="mt-4 space-y-2">
              <div className="h-14 animate-pulse rounded bg-muted" />
              <div className="h-14 animate-pulse rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </PageShell>
  );
}
