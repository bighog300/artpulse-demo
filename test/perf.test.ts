import test from "node:test";
import assert from "node:assert/strict";
import { assertExplainSafe } from "../lib/perf/explain.ts";
import { createPerfSnapshotWithDeps, explainRequestSchema } from "../lib/perf/service.ts";

test("runExplain guard rejects semicolons", () => {
  assert.throws(() => assertExplainSafe('SELECT 1;'), /semicolon_not_allowed/);
});

test("runExplain guard rejects write keywords", () => {
  assert.throws(() => assertExplainSafe('SELECT 1 FROM "User" WHERE id IN (SELECT id FROM x) DELETE'), /write_not_allowed/);
});

test("runExplain guard rejects comments", () => {
  assert.throws(() => assertExplainSafe("SELECT 1 -- nope"), /comments_not_allowed/);
});

test("reject unknown query name", () => {
  const parsed = explainRequestSchema.safeParse({ name: "not_whitelisted", params: {} });
  assert.equal(parsed.success, false);
});

test("snapshot creation works with mocked explain and storage", async () => {
  let created = false;
  const result = await createPerfSnapshotWithDeps(
    {
      requireAdminUser: async () => ({ id: "00000000-0000-0000-0000-000000000099" }),
      explain: async () => "Seq Scan on Event",
      createSnapshot: async () => {
        created = true;
        return { id: "00000000-0000-0000-0000-000000000123" };
      },
    },
    { name: "events_list", params: { days: 30, limit: 20 } },
  );

  assert.equal(created, true);
  assert.equal(result.snapshotId, "00000000-0000-0000-0000-000000000123");
  assert.match(result.explainText, /Seq Scan/);
});

test("non-admin access rejected by service deps", async () => {
  await assert.rejects(
    () =>
      createPerfSnapshotWithDeps(
        {
          requireAdminUser: async () => {
            throw new Error("forbidden");
          },
          explain: async () => "ok",
          createSnapshot: async () => ({ id: "x" }),
        },
        { name: "events_list", params: {} },
      ),
    /forbidden/,
  );
});


test("unauthenticated access rejected by service deps", async () => {
  await assert.rejects(
    () =>
      createPerfSnapshotWithDeps(
        {
          requireAdminUser: async () => {
            throw new Error("unauthorized");
          },
          explain: async () => "ok",
          createSnapshot: async () => ({ id: "x" }),
        },
        { name: "events_list", params: {} },
      ),
    /unauthorized/,
  );
});


test("runExplain is gated behind PERF_EXPLAIN_ENABLED", async () => {
  const { runExplain } = await import("../lib/perf/explain.ts");
  const previous = process.env.PERF_EXPLAIN_ENABLED;
  process.env.PERF_EXPLAIN_ENABLED = "false";
  await assert.rejects(() => runExplain("SELECT 1", []), /explain_disabled/);
  process.env.PERF_EXPLAIN_ENABLED = previous;
});

test("runExplain is deny-by-default in production", async () => {
  const { runExplain } = await import("../lib/perf/explain.ts");
  const prevNodeEnv = process.env.NODE_ENV;
  const prevEnabled = process.env.PERF_EXPLAIN_ENABLED;
  const prevAllowProd = process.env.PERF_EXPLAIN_ALLOW_PROD;
  process.env.NODE_ENV = "production";
  process.env.PERF_EXPLAIN_ENABLED = "true";
  process.env.PERF_EXPLAIN_ALLOW_PROD = "false";

  await assert.rejects(() => runExplain("SELECT 1", []), /explain_disabled/);

  process.env.NODE_ENV = prevNodeEnv;
  process.env.PERF_EXPLAIN_ENABLED = prevEnabled;
  process.env.PERF_EXPLAIN_ALLOW_PROD = prevAllowProd;
});
