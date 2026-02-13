"use client";

import { useMemo, useState } from "react";
import { ErrorCard } from "@/components/ui/error-card";
import { LoadingCard } from "@/components/ui/loading-card";
import { enqueueToast } from "@/lib/toast";
import type { Notification, NotificationInboxStatus } from "@prisma/client";

type NotificationPageProps = {
  initialItems: Notification[];
  initialNextCursor: string | null;
};

function relativeTimeLabel(date: Date) {
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60_000));

  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const hours = Math.floor(diffMinutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(days / 365);
  return `${years}y ago`;
}

export function NotificationsClient({ initialItems, initialNextCursor }: NotificationPageProps) {
  const [items, setItems] = useState(initialItems);
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeTab, setActiveTab] = useState<"ALL" | "UNREAD">("ALL");
  const [error, setError] = useState<string | null>(null);

  const unreadCount = useMemo(() => items.filter((item) => item.status === "UNREAD").length, [items]);
  const visibleItems = useMemo(
    () => activeTab === "UNREAD" ? items.filter((item) => item.status === "UNREAD") : items,
    [activeTab, items],
  );

  async function markRead(id: string) {
    await fetch(`/api/notifications/${id}/read`, { method: "POST" });
    setItems((current) => current.map((item) => item.id === id ? { ...item, status: "READ" as NotificationInboxStatus } : item));
  }

  async function markAllRead() {
    const response = await fetch("/api/notifications/read-all", { method: "POST" });
    if (!response.ok) {
      enqueueToast({ title: "Unable to mark all read", variant: "error" });
      return;
    }
    setItems((current) => current.map((item) => ({ ...item, status: "READ" as NotificationInboxStatus })));
    enqueueToast({ title: "All notifications marked read" });
  }

  async function loadMore() {
    if (!nextCursor) return;
    setLoadingMore(true);
    try {
      setError(null);
      const response = await fetch(`/api/notifications?cursor=${nextCursor}&limit=20`);
      if (!response.ok) {
        setError("Unable to load more notifications right now.");
        return;
      }
      const data = await response.json() as { items: Notification[]; nextCursor: string | null };
      setItems((current) => [...current, ...data.items]);
      setNextCursor(data.nextCursor);
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <section className="space-y-4" aria-busy={loadingMore}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-gray-700">Unread: {unreadCount}</p>
        <button className="rounded border px-3 py-1 text-sm" type="button" onClick={markAllRead}>Mark all read</button>
      </div>

      <div className="flex items-center gap-2">
        <button
          className={`rounded border px-3 py-1 text-sm ${activeTab === "ALL" ? "border-black" : "border-gray-300"}`}
          type="button"
          onClick={() => setActiveTab("ALL")}
        >
          All
        </button>
        <button
          className={`rounded border px-3 py-1 text-sm ${activeTab === "UNREAD" ? "border-black" : "border-gray-300"}`}
          type="button"
          onClick={() => setActiveTab("UNREAD")}
        >
          Unread
        </button>
      </div>

      {error ? <ErrorCard message={error} onRetry={() => void loadMore()} /> : null}
      <ul className="space-y-2">
        {visibleItems.map((item) => (
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
              <p className="text-xs text-gray-500">{relativeTimeLabel(new Date(item.createdAt))}</p>
            </button>
          </li>
        ))}
      </ul>

      {loadingMore ? <LoadingCard lines={2} /> : null}
      {nextCursor ? (
        <button className="rounded border px-3 py-1 text-sm" type="button" disabled={loadingMore} onClick={loadMore}>
          {loadingMore ? "Loading..." : "Load more"}
        </button>
      ) : null}
    </section>
  );
}
