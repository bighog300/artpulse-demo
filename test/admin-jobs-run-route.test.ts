import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { handleAdminJobRun } from "../lib/admin-jobs-run-route.ts";

test("POST /api/admin/jobs/run rejects unauthenticated users", async () => {
  const req = new NextRequest("http://localhost/api/admin/jobs/run", {
    method: "POST",
    body: JSON.stringify({ name: "health.ping" }),
    headers: { "content-type": "application/json" },
  });

  const res = await handleAdminJobRun(req, {
    requireAdminUser: async () => {
      throw new Error("unauthorized");
    },
    runJobFn: async () => {
      throw new Error("should_not_run");
    },
    logAdminAction: async () => {},
  });

  assert.equal(res.status, 401);
});

test("POST /api/admin/jobs/run rejects non-admin users", async () => {
  const req = new NextRequest("http://localhost/api/admin/jobs/run", {
    method: "POST",
    body: JSON.stringify({ name: "health.ping" }),
    headers: { "content-type": "application/json" },
  });

  const res = await handleAdminJobRun(req, {
    requireAdminUser: async () => {
      throw new Error("forbidden");
    },
    runJobFn: async () => {
      throw new Error("should_not_run");
    },
    logAdminAction: async () => {},
  });

  assert.equal(res.status, 403);
});

test("POST /api/admin/jobs/run runs health.ping for admins and writes audit", async () => {
  const req = new NextRequest("http://localhost/api/admin/jobs/run", {
    method: "POST",
    body: JSON.stringify({ name: "health.ping" }),
    headers: { "content-type": "application/json" },
  });

  let auditCallCount = 0;
  const res = await handleAdminJobRun(req, {
    requireAdminUser: async () => ({ email: "admin@example.com" }),
    runJobFn: async () => ({
      id: "job-run-1",
      name: "health.ping",
      status: "succeeded",
      trigger: "admin",
      createdAt: new Date(),
      startedAt: new Date(),
      finishedAt: new Date(),
      actorEmail: "admin@example.com",
      message: "ok",
      metadata: null,
    }),
    logAdminAction: async () => {
      auditCallCount += 1;
    },
  });

  assert.equal(res.status, 200);
  const payload = await res.json();
  assert.equal(payload.ok, true);
  assert.equal(payload.run.status, "succeeded");
  assert.equal(auditCallCount, 1);
});
