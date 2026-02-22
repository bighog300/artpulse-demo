import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { NotificationsClient } from "@/app/notifications/notifications-client";
import { setOnboardingFlagForSession } from "@/lib/onboarding";
import { redirectToLogin } from "@/lib/auth-redirect";
import { hasDatabaseUrl } from "@/lib/runtime-db";
import { NotificationsEmptyState } from "@/components/notifications/notifications-empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { PageShell } from "@/components/ui/page-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { listNotifications } from "@/lib/notifications";

export default async function NotificationsPage() {
  const user = await getSessionUser();
  if (!user) redirectToLogin("/notifications");

  if (!hasDatabaseUrl()) {
    return (
      <PageShell className="page-stack">
        <PageHeader title="Notifications" subtitle="Updates from your follows, invites, and saved searches" />
        <EmptyState title="Notifications unavailable" description="Set DATABASE_URL to view notifications in local development." actions={[{ label: "Go to Following", href: "/following", variant: "secondary" }]} />
      </PageShell>
    );
  }

  const page = await listNotifications(db, user.id, { limit: 20 });
  await setOnboardingFlagForSession(user, "hasViewedNotifications", true, { path: "/notifications" });
  const items = page.items;

  return (
    <PageShell className="page-stack">
      <PageHeader title="Notifications" subtitle="Updates from your follows, invites, and saved searches" />
      {items.length === 0 ? <NotificationsEmptyState /> : null}
      <NotificationsClient initialItems={items} initialNextCursor={page.nextCursor} />
    </PageShell>
  );
}
