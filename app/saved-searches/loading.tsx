import { LoadingCard } from "@/components/ui/loading-card";

export default function Loading() {
  return (
    <main className="space-y-3 p-6" aria-busy="true">
      <LoadingCard lines={3} />
      <LoadingCard lines={3} />
    </main>
  );
}
