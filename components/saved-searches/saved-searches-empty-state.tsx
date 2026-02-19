import { EmptyState } from "@/components/ui/empty-state";

export function SavedSearchesEmptyState() {
  return (
    <EmptyState
      title="Build your personal event radar"
      description="Saved searches automatically check for new matches and send digest updates so you never miss the shows you care about."
      actions={[{ label: "Create your first saved search", href: "/search" }]}
    />
  );
}
