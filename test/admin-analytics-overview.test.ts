import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { handleAdminAnalyticsOverview } from "../lib/admin-analytics-route.ts";

test("/api/admin/analytics/overview rejects unauthenticated users", async () => {
  const req = new NextRequest("http://localhost/api/admin/analytics/overview?days=7");
  const res = await handleAdminAnalyticsOverview(req, {
    requireAdminUser: async () => {
      throw new Error("unauthorized");
    },
    analyticsDb: { engagementEvent: { count: async () => 0, groupBy: async () => [] } } as never,
  });

  assert.equal(res.status, 401);
});

test("/api/admin/analytics/overview rejects non-admin users", async () => {
  const req = new NextRequest("http://localhost/api/admin/analytics/overview?days=30");
  const res = await handleAdminAnalyticsOverview(req, {
    requireAdminUser: async () => {
      throw new Error("forbidden");
    },
    analyticsDb: { engagementEvent: { count: async () => 0, groupBy: async () => [] } } as never,
  });

  assert.equal(res.status, 403);
});
