import { LoadingCard } from "@/components/ui/loading-card";
import { PageHeader } from "@/components/ui/page-header";
import { PageShell } from "@/components/ui/page-shell";
import { Section } from "@/components/ui/section";

export default function Loading() {
  return (
    <PageShell className="space-y-4">
      <PageHeader title="Venues" subtitle="Find spaces hosting exhibitions, performances, and shows." />
      <Section title="Featured venues"><LoadingCard lines={3} /></Section>
      <Section title="All venues"><LoadingCard lines={6} /></Section>
    </PageShell>
  );
}
