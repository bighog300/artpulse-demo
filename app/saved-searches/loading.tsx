import { PageHeader } from "@/components/ui/page-header";
import { PageShell } from "@/components/ui/page-shell";
import { LoadingCard } from "@/components/ui/loading-card";

export default function Loading() {
  return (
    <PageShell className="space-y-4" aria-busy="true">
      <PageHeader title="Saved Searches" subtitle="Automate updates for what you care about" />
      <LoadingCard lines={3} />
      <LoadingCard lines={3} />
    </PageShell>
  );
}
