import test from "node:test";
import assert from "node:assert/strict";
import type { NotificationOutbox, NotificationType } from "@prisma/client";
import { sendPendingNotificationsWithDb } from "../lib/outbox-worker.ts";

type OutboxStatus = NotificationOutbox["status"];

function createMemoryDb(seed: NotificationOutbox[]) {
  const rows = new Map(seed.map((row) => [row.id, { ...row }]));

  return {
    rows,
    db: {
      notificationOutbox: {
        async findMany(args: {
          where: { status: "PENDING"; errorMessage: null };
          orderBy: { createdAt: "asc" };
          take: number;
        }) {
          return [...rows.values()]
            .filter((row) => row.status === args.where.status && row.errorMessage === args.where.errorMessage)
            .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
            .slice(0, args.take)
            .map((row) => ({
              id: row.id,
              type: row.type,
              toEmail: row.toEmail,
              payload: row.payload as Record<string, unknown>,
              dedupeKey: row.dedupeKey,
            }));
        },
        async updateMany(args: {
          where: { id: string; status: "PENDING"; errorMessage?: string | null };
          data: { status?: OutboxStatus; sentAt?: Date | null; errorMessage: string | null };
        }) {
          const row = rows.get(args.where.id);
          if (!row || row.status !== args.where.status) {
            return { count: 0 };
          }

          if (Object.prototype.hasOwnProperty.call(args.where, "errorMessage") && row.errorMessage !== args.where.errorMessage) {
            return { count: 0 };
          }

          if (args.data.status) {
            row.status = args.data.status;
          }
          if (Object.prototype.hasOwnProperty.call(args.data, "sentAt")) {
            row.sentAt = args.data.sentAt ?? null;
          }
          row.errorMessage = args.data.errorMessage;
          rows.set(row.id, row);
          return { count: 1 };
        },
      },
    },
  };
}

function makeOutboxRow(id: string, status: OutboxStatus, createdAt: string): NotificationOutbox {
  return {
    id,
    type: "SUBMISSION_APPROVED" satisfies NotificationType,
    toEmail: "person@example.com",
    payload: { id },
    dedupeKey: `dedupe-${id}`,
    status,
    createdAt: new Date(createdAt),
    sentAt: null,
    errorMessage: null,
  };
}

test("outbox worker sends pending rows and does not resend SENT rows", async () => {
  const { db, rows } = createMemoryDb([
    makeOutboxRow("oldest-pending", "PENDING", "2026-01-01T00:00:00.000Z"),
    makeOutboxRow("already-sent", "SENT", "2026-01-01T00:01:00.000Z"),
    makeOutboxRow("newer-pending", "PENDING", "2026-01-01T00:02:00.000Z"),
  ]);

  const firstRun = await sendPendingNotificationsWithDb({ limit: 25 }, db);
  assert.deepEqual(firstRun, { sent: 2, failed: 0, skipped: 0 });
  assert.equal(rows.get("oldest-pending")?.status, "SENT");
  assert.equal(rows.get("newer-pending")?.status, "SENT");

  const secondRun = await sendPendingNotificationsWithDb({ limit: 25 }, db);
  assert.deepEqual(secondRun, { sent: 0, failed: 0, skipped: 0 });
  assert.equal(rows.get("already-sent")?.status, "SENT");
});
