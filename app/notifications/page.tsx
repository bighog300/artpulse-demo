import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { NotificationsClient } from "@/app/notifications/notifications-client";
import { setOnboardingFlag } from "@/lib/onboarding";
import { redirectToLogin } from "@/lib/auth-redirect";

export default async function NotificationsPage() {
  const user = await getSessionUser();
  if (!user) redirectToLogin("/notifications");

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
      <h1 className="text-2xl font-semibold">Notifications</h1>
      {items.length === 0 ? (
        <section className="rounded border bg-zinc-50 p-5 text-sm">
          <h2 className="text-lg font-semibold">No notifications yet</h2>
          <p className="mt-2 text-zinc-700">When someone invites you, reviews a submission, or sends updates, you’ll see it here.</p>
          <p className="mt-2 text-zinc-700">Try <Link className="underline" href="/following">following artists or venues</Link>, or visit <Link className="underline" href="/my/venues">My Venues</Link>.</p>
        </section>
      ) : null}
      <NotificationsClient initialItems={items} initialNextCursor={hasMore ? items[items.length - 1]?.id ?? null : null} />
    </main>
  );
}
