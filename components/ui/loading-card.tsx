import { Skeleton } from "@/components/ui/skeleton";

type LoadingCardProps = {
  lines?: number;
  label?: string;
  className?: string;
};

export function LoadingCard({ lines = 3, label = "Loading...", className }: LoadingCardProps) {
  return (
    <div className={`rounded border p-4 ${className ?? ""}`} aria-busy="true" aria-live="polite">
      <p className="sr-only">{label}</p>
      <Skeleton className="h-5 w-2/3" />
      <div className="mt-3 space-y-2">
        {Array.from({ length: lines }).map((_, idx) => <Skeleton key={idx} className="h-4 w-full" />)}
      </div>
    </div>
  );
}
