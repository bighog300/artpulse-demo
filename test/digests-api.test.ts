import test from "node:test";
import assert from "node:assert/strict";
import { listDigestsForUser } from "../lib/digests.ts";

test("/api/digests listing logic scopes by user", async () => {
  let whereUserId: string | null = null;
  const db = {
    digestRun: {
      findMany: async (args: any) => {
        whereUserId = args.where.userId;
        return [];
      },
      findFirst: async () => null,
    },
  };

  const result = await listDigestsForUser(db as never, { userId: "user-a", limit: 20 });
  assert.equal(whereUserId, "user-a");
  assert.deepEqual(result, { items: [], nextCursor: null });
});
