import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { handleAdminAnalyticsDrilldown, handleAdminAnalyticsTopTargets } from "../lib/admin-analytics-drilldown-route.ts";
import { aggregateDrilldown, aggregateTopTargets } from "../lib/admin-analytics-drilldown.ts";

const mockDb = {
  engagementEvent: {
    findMany: async () => [],
    groupBy: async () => [],
  },
  event: { findMany: async () => [], findUnique: async () => null },
  venue: { findMany: async () => [], findUnique: async () => null },
  artist: { findMany: async () => [], findUnique: async () => null },
} as never;

test("/api/admin/analytics/drilldown rejects unauthenticated users", async () => {
  const req = new NextRequest("http://localhost/api/admin/analytics/drilldown?targetType=EVENT&targetId=abc");
  const res = await handleAdminAnalyticsDrilldown(req, {
    requireAdminUser: async () => {
      throw new Error("unauthorized");
    },
    analyticsDb: mockDb,
  });

  assert.equal(res.status, 401);
});

test("/api/admin/analytics/top-targets rejects non-admin users", async () => {
  const req = new NextRequest("http://localhost/api/admin/analytics/top-targets?targetType=EVENT");
  const res = await handleAdminAnalyticsTopTargets(req, {
    requireAdminUser: async () => {
      throw new Error("forbidden");
    },
    analyticsDb: mockDb,
  });

  assert.equal(res.status, 403);
});

test("drilldown endpoint validates query params", async () => {
  const req = new NextRequest("http://localhost/api/admin/analytics/drilldown?targetType=NOPE&targetId=");
  const res = await handleAdminAnalyticsDrilldown(req, {
    requireAdminUser: async () => ({ id: "admin" }),
    analyticsDb: mockDb,
  });

  assert.equal(res.status, 400);
  const body = await res.json();
  assert.equal(body.error.code, "invalid_request");
});

test("top-targets endpoint validates query params", async () => {
  const req = new NextRequest("http://localhost/api/admin/analytics/top-targets?targetType=EVENT&limit=2");
  const res = await handleAdminAnalyticsTopTargets(req, {
    requireAdminUser: async () => ({ id: "admin" }),
    analyticsDb: mockDb,
  });

  assert.equal(res.status, 400);
  const body = await res.json();
  assert.equal(body.error.code, "invalid_request");
});

test("aggregateDrilldown computes totals, ctr, and by-day grouping", () => {
  const fixedNow = new Date("2026-03-10T10:00:00.000Z").valueOf();
  const originalNow = Date.now;
  Date.now = () => fixedNow;

  try {
    const payload = aggregateDrilldown(7, "EVENT", "target-1", [
      { action: "VIEW", surface: "SEARCH", createdAt: new Date("2026-03-10T01:00:00.000Z") },
      { action: "CLICK", surface: "SEARCH", createdAt: new Date("2026-03-10T02:00:00.000Z") },
      { action: "VIEW", surface: "DIGEST", createdAt: new Date("2026-03-09T08:00:00.000Z") },
      { action: "CLICK", surface: "NEARBY", createdAt: new Date("2026-03-08T08:00:00.000Z") },
    ]);

    assert.equal(payload.totals.events, 4);
    assert.equal(payload.totals.views, 2);
    assert.equal(payload.totals.clicks, 2);
    assert.equal(payload.totals.ctr, 1);

    const day10 = payload.byDay.find((day) => day.day === "2026-03-10");
    assert.deepEqual(day10, { day: "2026-03-10", views: 1, clicks: 1 });

    const search = payload.bySurface.find((row) => row.surface === "SEARCH");
    assert.deepEqual(search, { surface: "SEARCH", views: 1, clicks: 1, ctr: 1 });
  } finally {
    Date.now = originalNow;
  }
});

test("aggregateTopTargets computes and sorts by metric", () => {
  const items = aggregateTopTargets([
    { targetId: "a", action: "CLICK", _count: { _all: 10 } },
    { targetId: "a", action: "VIEW", _count: { _all: 20 } },
    { targetId: "b", action: "CLICK", _count: { _all: 9 } },
    { targetId: "b", action: "VIEW", _count: { _all: 5 } },
  ], "views", 10);

  assert.equal(items[0].targetId, "a");
  assert.equal(items[0].ctr, 0.5);
  assert.equal(items[1].targetId, "b");
  assert.equal(items[1].ctr, 1.8);
});
