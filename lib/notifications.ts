import { inviteCreatedDedupeKey, submissionDecisionDedupeKey, submissionSubmittedDedupeKey } from "@/lib/notification-keys";
import { NotificationStatus, NotificationType, Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export async function enqueueNotification(params: {
  type: NotificationType;
  toEmail: string;
  payload: Prisma.InputJsonValue;
  dedupeKey: string;
}) {
  return db.notificationOutbox.upsert({
    where: { dedupeKey: params.dedupeKey },
    create: {
      type: params.type,
      toEmail: params.toEmail.toLowerCase(),
      payload: params.payload,
      dedupeKey: params.dedupeKey,
    },
    update: {},
  });
}

export async function sendPendingNotifications(limit: number) {
  const pending = await db.notificationOutbox.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
    take: limit,
  });

  const results: Array<{ id: string; status: NotificationStatus; errorMessage: string | null }> = [];

  for (const notification of pending) {
    try {
      console.log(
        `[outbox] ${notification.type} to=${notification.toEmail} dedupe=${notification.dedupeKey} payload=${JSON.stringify(notification.payload)}`,
      );
      const sent = await db.notificationOutbox.update({
        where: { id: notification.id },
        data: {
          status: "SENT",
          sentAt: new Date(),
          errorMessage: null,
        },
      });
      results.push({ id: sent.id, status: sent.status, errorMessage: sent.errorMessage });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown send error";
      const failed = await db.notificationOutbox.update({
        where: { id: notification.id },
        data: {
          status: "FAILED",
          errorMessage: message,
        },
      });
      results.push({ id: failed.id, status: failed.status, errorMessage: failed.errorMessage });
    }
  }

  return {
    attempted: pending.length,
    sent: results.filter((entry) => entry.status === "SENT").length,
    failed: results.filter((entry) => entry.status === "FAILED").length,
    results,
  };
}

export { inviteCreatedDedupeKey, submissionDecisionDedupeKey, submissionSubmittedDedupeKey };
