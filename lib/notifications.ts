import { inviteCreatedDedupeKey, submissionDecisionDedupeKey, submissionSubmittedDedupeKey } from "@/lib/notification-keys";
import { NotificationType, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { buildNotification, NotificationTemplatePayload } from "@/lib/notification-templates";

type EnqueueNotificationParams = {
  type: NotificationType;
  toEmail: string;
  payload: Prisma.InputJsonValue;
  dedupeKey: string;
  inApp?: {
    userId: string;
    title: string;
    body: string;
    href?: string;
    dedupeKey?: string;
  };
};

type NotificationDb = Pick<typeof db, "notificationOutbox" | "notification" | "$transaction">;

export function buildInAppFromTemplate(userId: string, type: NotificationType, payload: NotificationTemplatePayload) {
  const built = buildNotification({ type, payload });
  return {
    userId,
    title: built.title,
    body: built.body,
    href: built.href,
    dedupeKey: built.dedupeKey,
  };
}

export async function enqueueNotificationWithDb(notificationDb: NotificationDb, params: EnqueueNotificationParams) {
  const outboxOp = notificationDb.notificationOutbox.upsert({
    where: { dedupeKey: params.dedupeKey },
    create: {
      type: params.type,
      toEmail: params.toEmail.toLowerCase(),
      payload: params.payload,
      dedupeKey: params.dedupeKey,
    },
    update: {},
  });

  if (!params.inApp) {
    return outboxOp;
  }

  const inboxOp = notificationDb.notification.upsert({
    where: { dedupeKey: params.inApp.dedupeKey ?? params.dedupeKey },
    create: {
      userId: params.inApp.userId,
      type: params.type,
      title: params.inApp.title,
      body: params.inApp.body,
      href: params.inApp.href,
      dedupeKey: params.inApp.dedupeKey ?? params.dedupeKey,
    },
    update: {},
  });

  const [outbox] = await notificationDb.$transaction([outboxOp, inboxOp]);
  return outbox;
}

export async function enqueueNotification(params: EnqueueNotificationParams) {
  return enqueueNotificationWithDb(db, params);
}

export { inviteCreatedDedupeKey, submissionDecisionDedupeKey, submissionSubmittedDedupeKey };
