import test from "node:test";
import assert from "node:assert/strict";
import { sanitizeEngagementMeta } from "../lib/engagement.ts";

test("sanitizeEngagementMeta drops unknown keys and truncates query", () => {
  const meta = sanitizeEngagementMeta({
    digestRunId: "26d98b15-331f-4f6a-8f50-9c306ada6faf",
    position: 9,
    query: `   ${"x".repeat(140)}   `,
    extra: "ignore-me",
  }) as Record<string, unknown>;

  assert.deepEqual(Object.keys(meta).sort(), ["digestRunId", "position", "query"]);
  assert.equal(typeof meta.query, "string");
  assert.equal((meta.query as string).length, 120);
});

test("sanitizeEngagementMeta keeps only valid fields and returns undefined when empty", () => {
  const invalid = sanitizeEngagementMeta({ digestRunId: "not-a-uuid", position: 999, query: "   " });
  assert.equal(invalid, undefined);

  const feedback = sanitizeEngagementMeta({ feedback: "down", nope: true });
  assert.deepEqual(feedback, { feedback: "down" });
});
