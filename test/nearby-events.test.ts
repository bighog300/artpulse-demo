import test from "node:test";
import assert from "node:assert/strict";
import { buildNearbyEventsFilters, sortAndPaginateByStartAtId } from "../lib/nearby-events.ts";
import { getBoundingBox } from "../lib/geo.ts";

test("nearby events pagination is stable by startAt/id", () => {
  const events = [
    { id: "b", startAt: new Date("2026-01-02T00:00:00.000Z") },
    { id: "a", startAt: new Date("2026-01-02T00:00:00.000Z") },
    { id: "c", startAt: new Date("2026-01-03T00:00:00.000Z") },
  ];

  const page1 = sortAndPaginateByStartAtId(events, 2);
  assert.deepEqual(page1.items.map((item) => item.id), ["a", "b"]);
  assert.ok(page1.nextCursor);

  const page2 = sortAndPaginateByStartAtId(events, 2, page1.nextCursor ?? undefined);
  assert.deepEqual(page2.items.map((item) => item.id), ["c"]);
});

test("nearby event predicate reuses startAt cursor filters", () => {
  const from = new Date("2026-01-01T00:00:00.000Z");
  const to = new Date("2026-01-31T23:59:59.000Z");
  const cursor = { id: "evt_2", startAt: new Date("2026-01-10T10:00:00.000Z") };

  const filters = buildNearbyEventsFilters({ from, to, cursor });
  assert.deepEqual(filters.startAt, { gte: from, lte: to });
  assert.deepEqual(filters.cursorFilters, [{ OR: [{ startAt: { gt: cursor.startAt } }, { startAt: cursor.startAt, id: { gt: cursor.id } }] }]);
});

test("bounding box handles polar and date-line edge coordinates", () => {
  const nearNorthPole = getBoundingBox(89.9999, 179.9999, 25);
  assert.ok(Number.isFinite(nearNorthPole.minLng));
  assert.ok(Number.isFinite(nearNorthPole.maxLng));
  assert.ok(nearNorthPole.minLat >= -90);
  assert.ok(nearNorthPole.maxLat <= 90);

  const nearSouthPole = getBoundingBox(-89.9999, -179.9999, 25);
  assert.ok(Number.isFinite(nearSouthPole.minLng));
  assert.ok(Number.isFinite(nearSouthPole.maxLng));
  assert.ok(nearSouthPole.minLng >= -180);
  assert.ok(nearSouthPole.maxLng <= 180);
});
