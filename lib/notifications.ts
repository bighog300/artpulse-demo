import { inviteCreatedDedupeKey, submissionDecisionDedupeKey, submissionSubmittedDedupeKey } from "@/lib/notification-keys";
import { NotificationType, Prisma } from "@prisma/client";
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

export { inviteCreatedDedupeKey, submissionDecisionDedupeKey, submissionSubmittedDedupeKey };
