import { LoadingCard } from "@/components/ui/loading-card";
import { PageHeader } from "@/components/ui/page-header";
import { PageShell } from "@/components/ui/page-shell";

export default function Loading() {
  return (
    <PageShell className="page-stack" aria-busy="true">
      <PageHeader title="Notifications" subtitle="Updates from your follows, invites, and saved searches" />
      <LoadingCard lines={2} />
      <LoadingCard lines={3} />
      <LoadingCard lines={3} />
    </PageShell>
  );
}
