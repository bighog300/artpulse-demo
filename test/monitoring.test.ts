import test from "node:test";
import assert from "node:assert/strict";
import { captureException } from "../lib/monitoring/index.ts";

test("captureException does not throw when SENTRY_DSN is not set", () => {
  delete process.env.SENTRY_DSN;
  assert.doesNotThrow(() => captureException(new Error("boom"), { route: "/test" }));
});
