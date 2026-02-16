import { LoadingCard } from "@/components/ui/loading-card";

export default function Loading() {
  return (
    <main className="space-y-4 p-6">
      <LoadingCard lines={1} />
      <LoadingCard lines={6} />
    </main>
  );
}
