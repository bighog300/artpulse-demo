import test from "node:test";
import assert from "node:assert/strict";
import { digestClickPayload } from "../lib/digest-engagement.ts";

test("digest click instrumentation payload shape", () => {
  const payload = digestClickPayload({ digestRunId: "e0cb5e09-7705-4f69-a2af-b2b112adfb42", targetId: "event-slug", position: 3 });
  assert.deepEqual(payload, {
    surface: "DIGEST",
    action: "CLICK",
    targetType: "EVENT",
    targetId: "event-slug",
    meta: { digestRunId: "e0cb5e09-7705-4f69-a2af-b2b112adfb42", position: 3 },
  });
});
