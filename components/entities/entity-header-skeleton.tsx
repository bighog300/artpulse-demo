import { Skeleton } from "@/components/ui/skeleton";

export function EntityHeaderSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <Skeleton className="aspect-[16/5] w-full rounded-none" />
      <div className="-mt-10 p-4 md:p-6">
        <div className="flex items-end gap-4">
          <Skeleton className="h-20 w-20 rounded-full border-4 border-background" />
          <div className="w-full space-y-2">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-4 w-72" />
          </div>
        </div>
      </div>
    </div>
  );
}
