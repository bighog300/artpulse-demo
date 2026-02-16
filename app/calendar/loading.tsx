import { LoadingCard } from "@/components/ui/loading-card";
import { PageHeader } from "@/components/ui/page-header";
import { Section } from "@/components/ui/section";

export default function Loading() {
  return (
    <main className="space-y-4 p-6">
      <PageHeader title="Calendar" subtitle="View events by month, week, or agenda." />
      <Section title="Controls"><LoadingCard lines={2} /></Section>
      <Section title="Calendar view"><LoadingCard lines={6} /></Section>
    </main>
  );
}
