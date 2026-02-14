import test from "node:test";
import assert from "node:assert/strict";
import { splitVenueEvents } from "../lib/venue-events";

test("splitVenueEvents separates upcoming and past with boundary at now", () => {
  const now = new Date("2026-03-01T12:00:00.000Z");
  const events = [
    { id: "past-1", startAt: new Date("2026-02-20T12:00:00.000Z") },
    { id: "upcoming-1", startAt: new Date("2026-03-10T12:00:00.000Z") },
    { id: "boundary", startAt: new Date("2026-03-01T12:00:00.000Z") },
    { id: "past-2", startAt: new Date("2026-02-25T12:00:00.000Z") },
  ];

  const { upcoming, past } = splitVenueEvents(events, now);

  assert.deepEqual(upcoming.map((event) => event.id), ["boundary", "upcoming-1"]);
  assert.deepEqual(past.map((event) => event.id), ["past-2", "past-1"]);
});
