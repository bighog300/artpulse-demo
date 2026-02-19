import { EmptyState } from "@/components/ui/empty-state";

export function SavedSearchesEmptyState() {
  return (
    <EmptyState
      title="Build your personal event radar"
      description="Create your first saved search. Weekly roundups are delivered automatically."
      actions={[{ label: "Create your first saved search", href: "/search" }]}
    />
  );
}
