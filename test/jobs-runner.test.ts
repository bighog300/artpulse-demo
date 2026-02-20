import test from "node:test";
import assert from "node:assert/strict";
import { runJobWithStore } from "../lib/jobs/run-job.ts";

test("runJob(health.ping) creates and completes a succeeded JobRun", async () => {
  const records = new Map<string, any>();
  const store = {
    findFirst: async () => null,
    create: async ({ data }: { data: any }) => {
      const created = {
        id: "job-1",
        createdAt: new Date(),
        finishedAt: null,
        message: null,
        ...data,
      };
      records.set(created.id, created);
      return created;
    },
    update: async ({ where, data }: { where: { id: string }; data: any }) => {
      const current = records.get(where.id);
      const updated = { ...current, ...data };
      records.set(where.id, updated);
      return updated;
    },
  };

  const run = await runJobWithStore("health.ping", { trigger: "system" }, store as never);

  assert.equal(run.name, "health.ping");
  assert.equal(run.status, "succeeded");
  assert.equal(run.trigger, "system");
  assert.ok(run.startedAt);
  assert.ok(run.finishedAt);
  assert.equal(records.get("job-1")?.status, "succeeded");
});
