import { Skeleton } from "@/components/ui/skeleton";

export function StartPackSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="rounded-lg border p-3">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="mt-2 h-3 w-full" />
          <Skeleton className="mt-1 h-3 w-3/4" />
        </div>
      ))}
    </div>
  );
}
