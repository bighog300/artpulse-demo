import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { NotificationsClient } from "@/app/notifications/notifications-client";
import { setOnboardingFlag } from "@/lib/onboarding";
import { redirectToLogin } from "@/lib/auth-redirect";
import { hasDatabaseUrl } from "@/lib/runtime-db";
import { NotificationsEmptyState } from "@/components/notifications/notifications-empty-state";
import { PageHeader } from "@/components/ui/page-header";

export default async function NotificationsPage() {
  const user = await getSessionUser();
  if (!user) redirectToLogin("/notifications");

  if (!hasDatabaseUrl()) {
    return (
      <main className="space-y-4 p-6">
        <PageHeader title="Notifications" subtitle="Updates about follows, invites, and saved search activity." />
        <p>Set DATABASE_URL to view notifications locally.</p>
      </main>
    );
  }

  const limit = 20;
  const page = await db.notification.findMany({
    where: { userId: user.id },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1,
  });
  await setOnboardingFlag(user.id, "hasViewedNotifications");

  const hasMore = page.length > limit;
  const items = hasMore ? page.slice(0, limit) : page;

  return (
    <main className="space-y-4 p-6">
      <PageHeader title="Notifications" subtitle="Updates about follows, invites, and saved search activity." />
      {items.length === 0 ? <NotificationsEmptyState /> : null}
      <NotificationsClient initialItems={items} initialNextCursor={hasMore ? items[items.length - 1]?.id ?? null : null} />
    </main>
  );
}
