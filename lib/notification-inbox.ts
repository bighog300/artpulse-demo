import { db } from "@/lib/db";
import { NotificationType } from "@prisma/client";
import { buildNotification, NotificationTemplatePayload } from "@/lib/notification-templates";

type InboxDb = Pick<typeof db, "notification">;

export function buildInboxNotification(type: NotificationType, payload: NotificationTemplatePayload) {
  return buildNotification({ type, payload });
}

export async function markNotificationReadWithDb(inboxDb: InboxDb, userId: string, notificationId: string) {
  const result = await inboxDb.notification.updateMany({
    where: { id: notificationId, userId },
    data: { status: "READ" },
  });
  return result.count > 0;
}

export async function markAllNotificationsReadWithDb(inboxDb: InboxDb, userId: string) {
  const result = await inboxDb.notification.updateMany({
    where: { userId, status: "UNREAD" },
    data: { status: "READ" },
  });
  return result.count;
}

export async function markNotificationRead(userId: string, notificationId: string) {
  return markNotificationReadWithDb(db, userId, notificationId);
}

export async function markAllNotificationsRead(userId: string) {
  return markAllNotificationsReadWithDb(db, userId);
}
