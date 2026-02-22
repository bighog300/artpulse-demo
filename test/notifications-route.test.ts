import test from "node:test";
import assert from "node:assert/strict";
import type { Notification, NotificationType } from "@prisma/client";
import { countUnreadNotifications, listNotifications, markNotificationsRead } from "../lib/notifications";

function createNotification(id: string, createdAt: string, overrides: Partial<Notification> = {}): Notification {
  return {
    id,
    userId: "user-1",
    type: "SUBMISSION_APPROVED" satisfies NotificationType,
    title: `n-${id}`,
    body: "body",
    href: null,
    dedupeKey: `d-${id}`,
    status: "UNREAD",
    createdAt: new Date(createdAt),
    readAt: null,
    archivedAt: null,
    entityType: null,
    entityId: null,
    ...overrides,
  };
}

function memoryDb(seed: Notification[]) {
  const rows = [...seed];
  return {
    rows,
    notification: {
      findMany: async (args: { where: { userId: string; readAt?: null; archivedAt?: null; OR?: Array<{ createdAt: { lt: Date } } | { createdAt: Date; id: { lt: string } }> }; take: number }) => {
        const orFilters = args.where.OR;
        let filtered = rows.filter((row) => row.userId === args.where.userId && row.archivedAt == null);
        if (args.where.readAt === null) filtered = filtered.filter((row) => row.readAt == null);
        if (orFilters?.length) {
          filtered = filtered.filter((row) => {
            const f0 = orFilters[0] as { createdAt: { lt: Date } };
            const f1 = orFilters[1] as { createdAt: Date; id: { lt: string } };
            return row.createdAt < f0.createdAt.lt || (row.createdAt.getTime() === f1.createdAt.getTime() && row.id < f1.id.lt);
          });
        }
        return filtered
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime() || (a.id < b.id ? 1 : -1))
          .slice(0, args.take);
      },
      updateMany: async (args: { where: { userId: string; readAt: null; id?: { in: string[] } }; data: { readAt: Date; status: "READ" } }) => {
        let count = 0;
        for (const row of rows) {
          if (row.userId !== args.where.userId || row.readAt !== null) continue;
          if (args.where.id && !args.where.id.in.includes(row.id)) continue;
          row.readAt = args.data.readAt;
          row.status = "READ";
          count += 1;
        }
        return { count };
      },
      count: async (args: { where: { userId: string; readAt: null; archivedAt: null } }) => rows.filter((row) => row.userId === args.where.userId && row.readAt == null && row.archivedAt == null).length,
    },
  };
}

test("listNotifications returns ordered items with cursor", async () => {
  const db = memoryDb([
    createNotification("3", "2026-01-03T10:00:00.000Z"),
    createNotification("2", "2026-01-02T10:00:00.000Z"),
    createNotification("1", "2026-01-01T10:00:00.000Z"),
  ]);

  const first = await listNotifications(db as never, "user-1", { limit: 2 });
  assert.equal(first.items.length, 2);
  assert.equal(first.items[0]?.id, "3");
  assert.ok(first.nextCursor);

  const second = await listNotifications(db as never, "user-1", { limit: 2, cursor: first.nextCursor ?? undefined });
  assert.equal(second.items.length, 1);
  assert.equal(second.items[0]?.id, "1");
});

test("markNotificationsRead supports ids and all", async () => {
  const db = memoryDb([
    createNotification("a", "2026-01-03T10:00:00.000Z"),
    createNotification("b", "2026-01-02T10:00:00.000Z"),
  ]);

  await markNotificationsRead(db as never, "user-1", { ids: ["a"] });
  assert.equal(db.rows.find((row) => row.id === "a")?.status, "READ");
  assert.equal(db.rows.find((row) => row.id === "b")?.status, "UNREAD");

  await markNotificationsRead(db as never, "user-1", { all: true });
  assert.equal(db.rows.find((row) => row.id === "b")?.status, "READ");
});

test("countUnreadNotifications excludes archived and read", async () => {
  const db = memoryDb([
    createNotification("a", "2026-01-03T10:00:00.000Z"),
    createNotification("b", "2026-01-02T10:00:00.000Z", { readAt: new Date("2026-01-03T11:00:00.000Z"), status: "READ" }),
    createNotification("c", "2026-01-01T10:00:00.000Z", { archivedAt: new Date("2026-01-03T11:00:00.000Z") }),
  ]);

  const unread = await countUnreadNotifications(db as never, "user-1");
  assert.equal(unread, 1);
});
