import test from "node:test";
import assert from "node:assert/strict";
import { getMarkerEvents, resolveNearbyView } from "../lib/nearby-map.ts";

test("nearby view toggle resolves expected query values", () => {
  assert.equal(resolveNearbyView("list"), "list");
  assert.equal(resolveNearbyView("map"), "map");
  assert.equal(resolveNearbyView("invalid"), "list");
  assert.equal(resolveNearbyView(undefined), "list");
});

test("map marker input excludes events without coordinates", () => {
  const events = [
    { id: "evt_1", slug: "one", title: "One", startAt: "2026-01-01T00:00:00.000Z", venueName: "A", lat: 40, lng: -73 },
    { id: "evt_2", slug: "two", title: "Two", startAt: "2026-01-01T00:00:00.000Z", venueName: "B", lat: null, lng: -73 },
    { id: "evt_3", slug: "three", title: "Three", startAt: "2026-01-01T00:00:00.000Z", venueName: "C", mapLat: 41, mapLng: -74 },
  ];

  const { markers, omittedCount } = getMarkerEvents(events, 10);
  assert.equal(markers.length, 2);
  assert.deepEqual(markers.map((marker) => marker.id), ["evt_1", "evt_3"]);
  assert.equal(omittedCount, 0);
});
