import { Skeleton } from "@/components/ui/skeleton";

export function FollowedEntitySkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border p-3">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-8 w-20" />
    </div>
  );
}
