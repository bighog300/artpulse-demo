import { LoadingCard } from "@/components/ui/loading-card";
import { PageShell } from "@/components/ui/page-shell";

export default function Loading() {
  return (
    <PageShell className="space-y-3" aria-busy="true">
      <LoadingCard lines={3} />
      <LoadingCard lines={3} />
    </PageShell>
  );
}
