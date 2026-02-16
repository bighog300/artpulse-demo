import { LoadingCard } from "@/components/ui/loading-card";
import { PageHeader } from "@/components/ui/page-header";
import { Section } from "@/components/ui/section";

export default function Loading() {
  return (
    <main className="space-y-4 p-6">
      <PageHeader title="Venues" subtitle="Find spaces hosting exhibitions, performances, and shows." />
      <Section title="Featured venues"><LoadingCard lines={3} /></Section>
      <Section title="All venues"><LoadingCard lines={6} /></Section>
    </main>
  );
}
