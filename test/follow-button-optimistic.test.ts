import test from "node:test";
import assert from "node:assert/strict";
import { runOptimisticFollowToggle } from "../components/follows/follow-button";

test("runOptimisticFollowToggle optimistically updates then succeeds", async () => {
  const states: string[] = [];

  await runOptimisticFollowToggle(true, {
    fetcher: async () => true,
    onOptimistic: (next) => states.push(`optimistic:${next}`),
    onRevert: (next) => states.push(`revert:${next}`),
    onSuccess: (next) => states.push(`success:${next}`),
    onError: () => states.push("error"),
  });

  assert.deepEqual(states, ["optimistic:true", "success:true"]);
});

test("runOptimisticFollowToggle reverts on failure", async () => {
  const states: string[] = [];

  await runOptimisticFollowToggle(false, {
    fetcher: async () => false,
    onOptimistic: (next) => states.push(`optimistic:${next}`),
    onRevert: (next) => states.push(`revert:${next}`),
    onSuccess: (next) => states.push(`success:${next}`),
    onError: () => states.push("error"),
  });

  assert.deepEqual(states, ["optimistic:false", "revert:false", "error"]);
});
