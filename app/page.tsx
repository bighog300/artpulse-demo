import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function Home() {
  const user = await getSessionUser();
  const unreadCount = user ? await db.notification.count({ where: { userId: user.id, status: "UNREAD" } }) : 0;

  return (
    <main className="p-6 space-y-3">
      <h1 className="text-3xl font-semibold">Artpulse</h1>
      <p>Discover published art events, artists, and venues.</p>
      <div className="space-x-3">
        <Link className="underline" href="/events">Events</Link>
        <Link className="underline" href="/venues">Venues</Link>
        <Link className="underline" href="/artists">Artists</Link>
        <Link className="underline" href="/calendar">Calendar</Link>
        {user ? <Link className="underline" href="/for-you">For You</Link> : null}
      </div>
      {user ? (
        <p>
          <Link className="underline" href="/notifications">
            Notifications {unreadCount > 0 ? `(${unreadCount})` : ""}
          </Link>
        </p>
      ) : null}
    </main>
  );
}
