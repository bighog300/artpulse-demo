import { EmptyState } from "@/components/ui/empty-state";

export function NotificationsEmptyState() {
  return (
    <EmptyState
      title="No notifications yet"
      description="You’ll see invites, submission updates, and digests here."
      actions={[
        { label: "Following", href: "/following", variant: "secondary" },
        { label: "Saved searches", href: "/saved-searches", variant: "secondary" },
        { label: "For You", href: "/for-you", variant: "secondary" },
      ]}
    />
  );
}
