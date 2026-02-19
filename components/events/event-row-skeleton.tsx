import { Skeleton } from "@/components/ui/skeleton";

export function EventRowSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-3">
      <Skeleton className="h-9 w-12" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-3 w-1/3" />
      </div>
      <Skeleton className="hidden h-4 w-24 sm:block" />
      <Skeleton className="h-8 w-8 rounded-full" />
    </div>
  );
}
