import { LoadingCard } from "@/components/ui/loading-card";
import { PageHeader } from "@/components/ui/page-header";
import { PageShell } from "@/components/ui/page-shell";
import { Section } from "@/components/ui/section";

export default function Loading() {
  return (
    <PageShell className="space-y-4">
      <PageHeader title="Calendar" subtitle="Your saved and followed events" />
      <Section title="Controls"><LoadingCard lines={2} /></Section>
      <Section title="Calendar view"><LoadingCard lines={6} /></Section>
    </PageShell>
  );
}
