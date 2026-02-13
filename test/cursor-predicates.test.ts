import test from "node:test";
import assert from "node:assert/strict";
import { START_AT_ID_ORDER_BY, buildStartAtIdCursorPredicate } from "../lib/cursor-predicate.ts";
import { FOLLOWING_FEED_ORDER_BY, buildFollowingFeedCursorFilter } from "../lib/following-feed.ts";

test("events list cursor predicate uses startAt/id lexicographic ordering", () => {
  const cursor = { id: "evt_2", startAt: new Date("2026-02-01T12:00:00.000Z") };

  assert.deepEqual(START_AT_ID_ORDER_BY, [{ startAt: "asc" }, { id: "asc" }]);
  assert.deepEqual(buildStartAtIdCursorPredicate(cursor), [
    {
      OR: [
        { startAt: { gt: cursor.startAt } },
        { startAt: cursor.startAt, id: { gt: cursor.id } },
      ],
    },
  ]);
});

test("following feed cursor predicate uses startAt/id lexicographic ordering", () => {
  const cursor = { id: "evt_99", startAt: new Date("2026-03-05T08:30:00.000Z") };

  assert.deepEqual(FOLLOWING_FEED_ORDER_BY, [{ startAt: "asc" }, { id: "asc" }]);
  assert.deepEqual(buildFollowingFeedCursorFilter(cursor), [
    {
      OR: [
        { startAt: { gt: cursor.startAt } },
        { startAt: cursor.startAt, id: { gt: cursor.id } },
      ],
    },
  ]);
});
