import test from "node:test";
import assert from "node:assert/strict";
import { deleteFollowWithDeps, upsertFollowWithDeps } from "../lib/follows.ts";
import { getFollowingFeedWithDeps } from "../lib/following-feed.ts";
import { followStatusResponse } from "../lib/follow-counts.ts";

test("follow upsert is idempotent", async () => {
  const follows = new Set<string>();

  const input = { userId: "u1", targetType: "ARTIST" as const, targetId: "00000000-0000-0000-0000-000000000001" };

  const deps = {
    findTarget: async () => true,
    upsert: async ({ userId, targetType, targetId }: { userId: string; targetType: "ARTIST" | "VENUE"; targetId: string }) => {
      follows.add(`${userId}:${targetType}:${targetId}`);
    },
  };

  const first = await upsertFollowWithDeps(deps, input);
  const second = await upsertFollowWithDeps(deps, input);

  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.equal(follows.size, 1);
});

test("unfollow is idempotent", async () => {
  const follows = new Set<string>();
  const key = "u1:VENUE:00000000-0000-0000-0000-000000000002";
  follows.add(key);

  const input = { userId: "u1", targetType: "VENUE" as const, targetId: "00000000-0000-0000-0000-000000000002" };

  const deps = {
    deleteMany: async ({ userId, targetType, targetId }: { userId: string; targetType: "ARTIST" | "VENUE"; targetId: string }) => {
      follows.delete(`${userId}:${targetType}:${targetId}`);
    },
  };

  const first = await deleteFollowWithDeps(deps, input);
  const second = await deleteFollowWithDeps(deps, input);

  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.equal(follows.size, 0);
});

test("feed returns only published events", async () => {
  const result = await getFollowingFeedWithDeps(
    {
      now: () => new Date("2026-01-01T00:00:00.000Z"),
      findFollows: async () => [{ targetType: "ARTIST", targetId: "artist-1" }],
      findEvents: async () => [
        {
          id: "evt-1",
          slug: "published-event",
          title: "Published event",
          startAt: new Date("2026-01-02T00:00:00.000Z"),
          endAt: null,
          venue: null,
        },
      ],
    },
    { userId: "u1", days: 7, type: "both", limit: 20 },
  );

  assert.equal(result.items.length, 1);
  assert.equal(result.items[0].slug, "published-event");
});

test("counts endpoint returns followersCount and auth-sensitive isFollowing", () => {
  const unauthenticatedResponse = followStatusResponse({ followersCount: 12, isAuthenticated: false, hasFollow: true });
  const authenticatedResponse = followStatusResponse({ followersCount: 12, isAuthenticated: true, hasFollow: true });

  assert.deepEqual(unauthenticatedResponse, { isFollowing: false, followersCount: 12 });
  assert.deepEqual(authenticatedResponse, { isFollowing: true, followersCount: 12 });
});
