import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { LogoutButton } from "@/app/account/logout-button";
import { db } from "@/lib/db";

export default async function AccountPage() {
  const user = await getSessionUser();
  if (!user) {
    return (
      <main className="p-6">
        Please <Link className="underline" href="/login">login</Link>.
      </main>
    );
  }

  const unreadCount = await db.notification.count({ where: { userId: user.id, status: "UNREAD" } });

  return (
    <main className="space-y-2 p-6">
      <h1 className="text-2xl font-semibold">Account</h1>
      <p>{user.email}</p>
      <p>Role: {user.role}</p>
      <p><Link className="underline" href="/my/venues">Manage my venues</Link></p>
      <p><Link className="underline" href="/notifications">Notifications ({unreadCount})</Link></p>
      <LogoutButton />
    </main>
  );
}
