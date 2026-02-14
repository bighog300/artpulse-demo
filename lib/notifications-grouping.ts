import type { Notification, NotificationType } from "@prisma/client";

export type NotificationGroup = {
  key: string;
  label: string;
  items: Notification[];
};

export function notificationTypeGroup(type: NotificationType) {
  if (type.startsWith("INVITE_")) return "INVITES" as const;
  if (type.startsWith("SUBMISSION_")) return "SUBMISSIONS" as const;
  if (type === "DIGEST_READY") return "DIGESTS" as const;
  return "OTHER" as const;
}

export function notificationBucketLabel(createdAt: Date, now = new Date()) {
  const d = new Date(createdAt);
  const startNow = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.floor((startNow.getTime() - startDate.getTime()) / 86_400_000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function groupNotificationsByDay(items: Notification[], now = new Date()): NotificationGroup[] {
  const groups = new Map<string, NotificationGroup>();
  for (const item of items) {
    const label = notificationBucketLabel(new Date(item.createdAt), now);
    const key = `${new Date(item.createdAt).toISOString().slice(0, 10)}:${label}`;
    const existing = groups.get(key);
    if (existing) {
      existing.items.push(item);
    } else {
      groups.set(key, { key, label, items: [item] });
    }
  }
  return Array.from(groups.values());
}
