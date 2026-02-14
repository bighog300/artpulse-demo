import test from "node:test";
import assert from "node:assert/strict";
import { formatEventDateTimeRange } from "../lib/dates";

test("formatEventDateTimeRange formats start only", () => {
  const start = new Date("2026-01-10T18:30:00.000Z");
  assert.equal(formatEventDateTimeRange(start), "Starts Sat, Jan 10, 2026 at 6:30 PM UTC");
});

test("formatEventDateTimeRange formats start and end on same day", () => {
  const start = new Date("2026-01-10T18:30:00.000Z");
  const end = new Date("2026-01-10T20:00:00.000Z");
  assert.equal(formatEventDateTimeRange(start, end), "Sat, Jan 10, 2026, 6:30 PM–8:00 PM UTC");
});

test("formatEventDateTimeRange formats when end missing", () => {
  const start = new Date("2026-02-14T12:00:00.000Z");
  assert.match(formatEventDateTimeRange(start, null), /^Starts /);
});
