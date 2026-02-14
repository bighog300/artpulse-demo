"use client";

import { useMemo, useState } from "react";
import { ErrorCard } from "@/components/ui/error-card";
import { LoadingCard } from "@/components/ui/loading-card";
import { enqueueToast } from "@/lib/toast";
import { groupNotificationsByDay, notificationTypeGroup } from "@/lib/notifications-grouping";
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
  return `${Math.floor(days / 365)}y ago`;
}

async function refreshUnreadBadge() {
  try {
    await fetch("/api/notifications/unread-count", { cache: "no-store" });
    window.dispatchEvent(new Event("notifications:unread-refresh"));
  } catch {
    // best effort
  }
}

export function NotificationsClient({ initialItems, initialNextCursor }: NotificationPageProps) {
  const [items, setItems] = useState(initialItems);
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeTab, setActiveTab] = useState<"ALL" | "UNREAD">("ALL");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "INVITES" | "SUBMISSIONS" | "DIGESTS" | "OTHER">("ALL");
  const [error, setError] = useState<string | null>(null);
  const [markingAllRead, setMarkingAllRead] = useState(false);

  const unreadCount = useMemo(() => items.filter((item) => item.status === "UNREAD").length, [items]);
  const visibleItems = useMemo(() => items.filter((item) => {
    if (activeTab === "UNREAD" && item.status !== "UNREAD") return false;
    if (typeFilter === "ALL") return true;
    return notificationTypeGroup(item.type) === typeFilter;
  }), [activeTab, items, typeFilter]);
  const groups = useMemo(() => groupNotificationsByDay(visibleItems), [visibleItems]);

  async function markRead(id: string) {
    await fetch(`/api/notifications/${id}/read`, { method: "POST" });
    setItems((current) => current.map((item) => item.id === id ? { ...item, status: "READ" as NotificationInboxStatus } : item));
    void refreshUnreadBadge();
  }

  async function markBatch(ids: string[]) {
    const response = await fetch("/api/notifications/read-batch", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    if (!response.ok) return false;
    setItems((current) => current.map((item) => ids.includes(item.id) ? { ...item, status: "READ" as NotificationInboxStatus } : item));
    void refreshUnreadBadge();
    return true;
  }

  async function markAllRead() {
    if (markingAllRead) return;
    setMarkingAllRead(true);
    try {
      const unreadIds = items.filter((item) => item.status === "UNREAD").map((item) => item.id);
      let ok = true;
      for (let i = 0; i < unreadIds.length; i += 100) {
        const chunkOk = await markBatch(unreadIds.slice(i, i + 100));
        if (!chunkOk) { ok = false; break; }
      }
      if (!ok) {
        enqueueToast({ title: "Unable to mark all read", variant: "error" });
        return;
      }
      enqueueToast({ title: "All notifications marked read" });
    } finally {
      setMarkingAllRead(false);
    }
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
        <button className="rounded border px-3 py-1 text-sm" type="button" onClick={markAllRead} disabled={markingAllRead}>{markingAllRead ? "Marking..." : "Mark all read"}</button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button className={`rounded border px-3 py-1 text-sm ${activeTab === "ALL" ? "border-black" : "border-gray-300"}`} type="button" onClick={() => setActiveTab("ALL")}>All</button>
        <button className={`rounded border px-3 py-1 text-sm ${activeTab === "UNREAD" ? "border-black" : "border-gray-300"}`} type="button" onClick={() => setActiveTab("UNREAD")}>Unread</button>
        <select className="rounded border px-2 py-1 text-sm" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as typeof typeFilter)}>
          <option value="ALL">All types</option>
          <option value="INVITES">Invites</option>
          <option value="SUBMISSIONS">Submissions</option>
          <option value="DIGESTS">Digests</option>
          <option value="OTHER">Other</option>
        </select>
      </div>

      {error ? <ErrorCard message={error} onRetry={() => void loadMore()} /> : null}
      <div className="space-y-3">
        {groups.map((group) => {
          const groupUnreadIds = group.items.filter((item) => item.status === "UNREAD").map((item) => item.id);
          return (
            <section key={group.key} className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-zinc-700">{group.label}</h2>
                {groupUnreadIds.length ? <button className="rounded border px-2 py-0.5 text-xs" type="button" onClick={() => void markBatch(groupUnreadIds)}>Mark section read</button> : null}
              </div>
              <ul className="space-y-2">
                {group.items.map((item) => (
                  <li key={item.id} className={`rounded border p-3 ${item.status === "UNREAD" ? "border-black" : "border-gray-300"}`}>
                    <button
                      type="button"
                      className="w-full text-left"
                      onClick={async () => {
                        await markRead(item.id);
                        if (item.href) window.location.href = item.href;
                      }}
                    >
                      <div className="flex items-center gap-2">
                        {item.status === "UNREAD" ? <span className="h-2 w-2 rounded-full bg-black" aria-hidden="true" /> : null}
                        <p className={item.status === "UNREAD" ? "font-semibold" : "font-medium"}>{item.title}</p>
                      </div>
                      <p className="text-sm text-gray-700">{item.body}</p>
                      <p className="text-xs text-gray-500">{relativeTimeLabel(new Date(item.createdAt))}</p>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      {loadingMore ? <LoadingCard lines={2} /> : null}
      {nextCursor ? <button className="rounded border px-3 py-1 text-sm" type="button" disabled={loadingMore} onClick={loadMore}>{loadingMore ? "Loading..." : "Load more"}</button> : null}
    </section>
  );
}
