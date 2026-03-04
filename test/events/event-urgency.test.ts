import test from "node:test";
import assert from "node:assert/strict";
import { getEventUrgencyStatus } from "../../lib/events/event-urgency";

test("returns happening_now when event is currently active", () => {
  const now = new Date("2026-01-01T12:00:00.000Z");
  const status = getEventUrgencyStatus("2026-01-01T10:00:00.000Z", "2026-01-01T15:00:00.000Z", now);

  assert.equal(status, "happening_now");
});

test("returns happening_now when end date is missing and event starts today", () => {
  const now = new Date("2026-01-01T20:00:00.000Z");
  const status = getEventUrgencyStatus("2026-01-01T01:00:00.000Z", null, now);

  assert.equal(status, "happening_now");
});

test("returns closing_soon when event ends within 48 hours", () => {
  const now = new Date("2026-01-01T12:00:00.000Z");
  const status = getEventUrgencyStatus("2026-01-02T18:00:00.000Z", "2026-01-03T04:00:00.000Z", now);

  assert.equal(status, "closing_soon");
});

test("returns opening_soon when event starts within 24 hours", () => {
  const now = new Date("2026-01-01T12:00:00.000Z");
  const status = getEventUrgencyStatus("2026-01-02T10:00:00.000Z", "2026-01-05T10:00:00.000Z", now);

  assert.equal(status, "opening_soon");
});

test("returns null when event is outside urgency windows", () => {
  const now = new Date("2026-01-01T12:00:00.000Z");
  const status = getEventUrgencyStatus("2026-01-05T12:00:00.000Z", "2026-01-10T12:00:00.000Z", now);

  assert.equal(status, null);
});
