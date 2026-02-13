import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { NotificationsClient } from "@/app/notifications/notifications-client";

export default async function NotificationsPage() {
  const user = await getSessionUser();
  if (!user) {
    return (
      <main className="p-6">
        Please <Link className="underline" href="/login">login</Link>.
      </main>
    );
  }

  const limit = 20;
  const page = await db.notification.findMany({
    where: { userId: user.id },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1,
  });

  const hasMore = page.length > limit;
  const items = hasMore ? page.slice(0, limit) : page;

  return (
    <main className="space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Notifications</h1>
      <NotificationsClient initialItems={items} initialNextCursor={hasMore ? items[items.length - 1]?.id ?? null : null} />
    </main>
  );
}
