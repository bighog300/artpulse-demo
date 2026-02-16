import { LoadingCard } from "@/components/ui/loading-card";

export default function Loading() {
  return (
    <main className="space-y-4 p-6">
      <LoadingCard lines={1} />
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, idx) => <LoadingCard key={idx} lines={2} />)}
      </div>
    </main>
  );
}
