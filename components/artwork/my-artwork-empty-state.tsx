import React from "react";
import { EmptyState } from "@/components/ui/empty-state";

export function MyArtworkEmptyState() {
  return (
    <EmptyState
      title="You haven’t added any artwork yet."
      description="Create your first artwork to start building your profile and submissions."
      actions={[{ label: "Add artwork", href: "/my/artwork/new" }]}
    />
  );
}
