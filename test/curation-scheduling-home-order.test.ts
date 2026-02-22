import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { curatedCollectionHomeOrderSchema, curatedCollectionPatchSchema } from "@/lib/validators";
import { handleAdminCurationHomeOrder } from "@/lib/admin-curation-home-order-route";
import { getCollectionState } from "@/lib/admin-curation-qa";

test("curatedCollectionPatchSchema rejects publishStartsAt >= publishEndsAt", () => {
  const parsed = curatedCollectionPatchSchema.safeParse({ publishStartsAt: "2026-04-03T10:00:00.000Z", publishEndsAt: "2026-04-03T10:00:00.000Z" });
  assert.equal(parsed.success, false);
});

test("curatedCollectionPatchSchema accepts null scheduling and pin/unpin", () => {
  const parsed = curatedCollectionPatchSchema.safeParse({ publishStartsAt: null, publishEndsAt: null, homeRank: null, showOnHome: true, showOnArtwork: false });
  assert.equal(parsed.success, true);
});

test("curatedCollectionHomeOrderSchema validates unique UUID ids", () => {
  const parsed = curatedCollectionHomeOrderSchema.safeParse({ orderedIds: ["00000000-0000-4000-8000-000000000001", "00000000-0000-4000-8000-000000000001"] });
  assert.equal(parsed.success, false);
});

test("home-order endpoint enforces admin and updates ranks deterministically", async () => {
  const req = new NextRequest("http://localhost/api/admin/curation/collections/home-order", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ orderedIds: ["00000000-0000-4000-8000-000000000001", "00000000-0000-4000-8000-000000000002"] }),
  });

  const state = new Map<string, number | null>([
    ["00000000-0000-4000-8000-000000000001", 5],
    ["00000000-0000-4000-8000-000000000002", null],
    ["00000000-0000-4000-8000-000000000003", 9],
  ]);

  const forbidden = await handleAdminCurationHomeOrder(req, {
    requireAdminUser: async () => { throw new Error("forbidden"); },
    getBefore: async () => [],
    updateOrder: async () => {},
    getAfter: async () => [],
    logAction: async () => {},
  });
  assert.equal(forbidden.status, 403);

  const ok = await handleAdminCurationHomeOrder(req, {
    requireAdminUser: async () => ({ email: "admin@example.com" }),
    getBefore: async (ids) => ids.map((id) => ({ id, homeRank: state.get(id) ?? null })),
    updateOrder: async (ids) => {
      ids.forEach((id, index) => state.set(id, index + 1));
    },
    getAfter: async (ids) => ids.map((id) => ({ id, homeRank: state.get(id) ?? null })),
    logAction: async () => {},
  });
  assert.equal(ok.status, 200);
  const body = await ok.json();
  assert.deepEqual(body.collections.map((c: { homeRank: number }) => c.homeRank), [1, 2]);
  assert.equal(state.get("00000000-0000-4000-8000-000000000003"), 9);
});

test("qa state helper marks future and expired windows", () => {
  const now = new Date("2026-04-03T12:00:00.000Z");
  assert.equal(getCollectionState({ isPublished: true, publishStartsAt: new Date("2026-04-04T00:00:00.000Z"), publishEndsAt: null }, now), "FUTURE");
  assert.equal(getCollectionState({ isPublished: true, publishStartsAt: null, publishEndsAt: new Date("2026-04-03T11:59:00.000Z") }, now), "EXPIRED");
});
