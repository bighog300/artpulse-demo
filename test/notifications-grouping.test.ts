import test from "node:test";
import assert from "node:assert/strict";
import { groupNotificationsByDay, notificationBucketLabel } from "../lib/notifications-grouping.ts";
import { scopedReadBatchIds } from "../lib/notifications-read-batch.ts";

test("notifications group labels today/yesterday/date", () => {
  const now = new Date("2026-02-14T12:00:00.000Z");
  assert.equal(notificationBucketLabel(new Date("2026-02-14T06:00:00.000Z"), now), "Today");
  assert.equal(notificationBucketLabel(new Date("2026-02-13T06:00:00.000Z"), now), "Yesterday");
  assert.match(notificationBucketLabel(new Date("2026-02-10T06:00:00.000Z"), now), /Feb/);
});

test("notifications grouping buckets list", () => {
  const now = new Date("2026-02-14T12:00:00.000Z");
  const items = [
    { id: "a", createdAt: new Date("2026-02-14T08:00:00.000Z") },
    { id: "b", createdAt: new Date("2026-02-13T08:00:00.000Z") },
  ] as any;
  const grouped = groupNotificationsByDay(items, now);
  assert.equal(grouped.length, 2);
  assert.equal(grouped[0]?.label, "Today");
});

test("read batch scoping only keeps owned IDs", () => {
  assert.deepEqual(scopedReadBatchIds(["a", "b", "c"], ["b", "c"]), ["b", "c"]);
});
