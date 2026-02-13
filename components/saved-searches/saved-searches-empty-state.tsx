import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";

export function SavedSearchesEmptyState() {
  return (
    <EmptyState
      title="Save searches to get weekly digests"
      description="Save filters from Search or Nearby to get notified when events match."
      actions={[
        { label: "Try a starter search", href: "/search?days=30", variant: "secondary" },
        { label: "Nearby", href: "/nearby", variant: "secondary" },
        { label: "Following", href: "/following", variant: "secondary" },
      ]}
    >
      <p className="text-xs text-zinc-600">Learn how: saved searches run weekly and send digest notifications when new events match your filters. <Link href="/saved-searches" className="underline">See details</Link>.</p>
    </EmptyState>
  );
}
