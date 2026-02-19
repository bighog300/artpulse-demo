import { PageShell } from "@/components/ui/page-shell";
import { LoadingCard } from "@/components/ui/loading-card";
import { PersonalFeedSkeleton } from "@/components/personal/personal-feed-skeleton";
import { FollowedEntitySkeleton } from "@/components/personal/followed-entity-skeleton";

export default function Loading() {
  return (
    <PageShell className="space-y-4" aria-busy="true">
      <LoadingCard lines={2} />
      <PersonalFeedSkeleton />
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, idx) => <FollowedEntitySkeleton key={idx} />)}
      </div>
    </PageShell>
  );
}
