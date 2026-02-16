import { LoadingCard } from "@/components/ui/loading-card";

export default function Loading() {
  return (
    <main className="space-y-4 p-6">
      <LoadingCard lines={1} />
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, idx) => <LoadingCard key={idx} lines={3} />)}
      </div>
    </main>
  );
}
