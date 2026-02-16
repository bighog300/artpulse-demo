import { LoadingCard } from "@/components/ui/loading-card";
import { PageHeader } from "@/components/ui/page-header";
import { Section } from "@/components/ui/section";

export default function Loading() {
  return (
    <main className="space-y-4 p-6">
      <PageHeader title="Events" subtitle="Discover what’s on near you" />
      <Section title="Trending"><LoadingCard lines={3} /></Section>
      <Section title="All events"><LoadingCard lines={6} /></Section>
    </main>
  );
}
