import { EmptyState } from "@/components/ui/empty-state";

export function NotificationsEmptyState() {
  return (
    <EmptyState
      title="No notifications yet"
      description="You’ll see invites, submission updates, and digests here."
      actions={[
        { label: "Discover events", href: "/events", variant: "secondary" },
        { label: "View details", href: "/following", variant: "secondary" },
        { label: "Create saved search", href: "/saved-searches", variant: "secondary" },
      ]}
    />
  );
}
