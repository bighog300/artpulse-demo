import { LoadingCard } from "@/components/ui/loading-card";
import { PageHeader } from "@/components/ui/page-header";
import { PageShell } from "@/components/ui/page-shell";
import { Section } from "@/components/ui/section";

export default function Loading() {
  return (
    <PageShell className="space-y-4">
      <PageHeader title="Artists" subtitle="Explore artists and track who to follow next." />
      <Section title="Featured artists"><LoadingCard lines={3} /></Section>
      <Section title="All artists"><LoadingCard lines={6} /></Section>
    </PageShell>
  );
}
