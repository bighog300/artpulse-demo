import type { Prisma } from "@prisma/client";

export type StartAtIdCursor = { startAt: Date; id: string };

export const START_AT_ID_ORDER_BY: Prisma.EventOrderByWithRelationInput[] = [{ startAt: "asc" }, { id: "asc" }];

export function buildStartAtIdCursorPredicate(cursor?: StartAtIdCursor | null): Prisma.EventWhereInput[] {
  if (!cursor) return [];
  return [{ OR: [{ startAt: { gt: cursor.startAt } }, { startAt: cursor.startAt, id: { gt: cursor.id } }] }];
}
