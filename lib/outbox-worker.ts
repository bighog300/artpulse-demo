import { NotificationType, Prisma } from "@prisma/client";

type OutboxRow = {
  id: string;
  type: NotificationType;
  toEmail: string;
  payload: Prisma.JsonValue;
  dedupeKey: string;
};

export type OutboxWorkerDb = {
  notificationOutbox: {
    findMany: (args: {
      where: { status: "PENDING"; errorMessage: null };
      orderBy: { createdAt: "asc" };
      take: number;
      select: {
        id: true;
        type: true;
        toEmail: true;
        payload: true;
        dedupeKey: true;
      };
    }) => Promise<OutboxRow[]>;
    updateMany: (args: {
      where: { id: string; status: "PENDING"; errorMessage?: string | null };
      data: { status?: "PENDING" | "SENT" | "FAILED"; sentAt?: Date | null; errorMessage: string | null };
    }) => Promise<{ count: number }>;
  };
};

export async function sendPendingNotificationsWithDb({ limit }: { limit: number }, db: OutboxWorkerDb) {
  const pending = await db.notificationOutbox.findMany({
    where: { status: "PENDING", errorMessage: null },
    orderBy: { createdAt: "asc" },
    take: limit,
    select: {
      id: true,
      type: true,
      toEmail: true,
      payload: true,
      dedupeKey: true,
    },
  });

  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const notification of pending) {
    const claimToken = `CLAIMED:${process.pid}:${Date.now()}:${Math.random().toString(36).slice(2)}`;
    const claimed = await db.notificationOutbox.updateMany({
      where: { id: notification.id, status: "PENDING", errorMessage: null },
      data: {
        errorMessage: claimToken,
      },
    });

    if (claimed.count === 0) {
      skipped += 1;
      continue;
    }

    try {
      console.log(
        `[outbox] ${notification.type} to=${notification.toEmail} dedupe=${notification.dedupeKey} payload=${JSON.stringify(notification.payload)}`,
      );

      const markedSent = await db.notificationOutbox.updateMany({
        where: { id: notification.id, status: "PENDING", errorMessage: claimToken },
        data: {
          status: "SENT",
          sentAt: new Date(),
          errorMessage: null,
        },
      });

      if (markedSent.count === 1) {
        sent += 1;
      } else {
        skipped += 1;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown send error";
      const markedFailed = await db.notificationOutbox.updateMany({
        where: { id: notification.id, status: "PENDING", errorMessage: claimToken },
        data: {
          status: "FAILED",
          sentAt: null,
          errorMessage: message,
        },
      });

      if (markedFailed.count === 1) {
        failed += 1;
      } else {
        skipped += 1;
      }
    }
  }

  return { sent, failed, skipped };
}
