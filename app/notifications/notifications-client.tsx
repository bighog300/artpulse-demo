"use client";

import { useMemo, useState } from "react";
import type { Notification, NotificationInboxStatus } from "@prisma/client";

type NotificationPageProps = {
  initialItems: Notification[];
  initialNextCursor: string | null;
};

export function NotificationsClient({ initialItems, initialNextCursor }: NotificationPageProps) {
  const [items, setItems] = useState(initialItems);
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor);
  const [loadingMore, setLoadingMore] = useState(false);

  const unreadCount = useMemo(() => items.filter((item) => item.status === "UNREAD").length, [items]);

  async function markRead(id: string) {
    await fetch(`/api/notifications/${id}/read`, { method: "POST" });
    setItems((current) => current.map((item) => item.id === id ? { ...item, status: "READ" as NotificationInboxStatus } : item));
  }

  async function markAllRead() {
    await fetch("/api/notifications/read-all", { method: "POST" });
    setItems((current) => current.map((item) => ({ ...item, status: "READ" as NotificationInboxStatus })));
  }

  async function loadMore() {
    if (!nextCursor) return;
    setLoadingMore(true);
    try {
      const response = await fetch(`/api/notifications?cursor=${nextCursor}&limit=20`);
      const data = await response.json() as { items: Notification[]; nextCursor: string | null };
      setItems((current) => [...current, ...data.items]);
      setNextCursor(data.nextCursor);
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-700">Unread: {unreadCount}</p>
        <button className="rounded border px-3 py-1 text-sm" type="button" onClick={markAllRead}>Mark all as read</button>
      </div>

      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id} className={`rounded border p-3 ${item.status === "UNREAD" ? "border-black" : "border-gray-300"}`}>
            <button
              type="button"
              className="w-full text-left"
              onClick={async () => {
                await markRead(item.id);
                if (item.href) window.location.href = item.href;
              }}
            >
              <p className="font-medium">{item.title}</p>
              <p className="text-sm text-gray-700">{item.body}</p>
              <p className="text-xs text-gray-500">{new Date(item.createdAt).toLocaleString()}</p>
            </button>
          </li>
        ))}
      </ul>

      {nextCursor ? (
        <button className="rounded border px-3 py-1 text-sm" type="button" disabled={loadingMore} onClick={loadMore}>
          {loadingMore ? "Loading..." : "Load more"}
        </button>
      ) : null}
    </section>
  );
}
