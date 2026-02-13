import { Prisma } from "@prisma/client";
import { digestSnapshotItemsSchema } from "@/lib/digest";

export type DigestsDb = {
  digestRun: {
    findMany: (args: Prisma.DigestRunFindManyArgs) => Promise<Array<{ id: string; userId: string; periodKey: string; itemCount: number; createdAt: Date; itemsJson: Prisma.JsonValue; savedSearch: { id: string; name: string } }>>;
    findFirst: (args: Prisma.DigestRunFindFirstArgs) => Promise<{ id: string; userId: string; periodKey: string; itemCount: number; createdAt: Date; itemsJson: Prisma.JsonValue; savedSearch: { id: string; name: string; isEnabled: boolean } } | null>;
  };
};

export async function listDigestsForUser(db: DigestsDb, args: { userId: string; cursor?: string; limit: number }) {
  const page = await db.digestRun.findMany({
    where: { userId: args.userId },
    include: { savedSearch: { select: { id: true, name: true } } },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: args.limit + 1,
    ...(args.cursor ? { cursor: { id: args.cursor }, skip: 1 } : {}),
  });
  const hasMore = page.length > args.limit;
  const items = hasMore ? page.slice(0, args.limit) : page;
  return { items, nextCursor: hasMore ? items[items.length - 1]?.id ?? null : null };
}

export async function getDigestByIdForUser(db: DigestsDb, args: { id: string; userId: string }) {
  const digest = await db.digestRun.findFirst({
    where: { id: args.id, userId: args.userId },
    include: { savedSearch: { select: { id: true, name: true, isEnabled: true } } },
  });
  if (!digest) return null;
  return { ...digest, itemsJson: digestSnapshotItemsSchema.parse(digest.itemsJson) };
}
