import test from "node:test";
import assert from "node:assert/strict";
import { handleGetMyArtworkAnalytics } from "@/lib/my-analytics-artwork-route";
import { computeArtworkAnalytics } from "@/lib/artwork-analytics";

test("/api/my/analytics/artwork requires auth", async () => {
  const res = await handleGetMyArtworkAnalytics({
    requireAuth: async () => { throw new Error("unauthorized"); },
    findOwnedArtistByUserId: async () => ({ id: "artist-1" }),
    listArtworksByArtistId: async () => [],
    listArtworkViewDailyRows: async () => [],
  });
  assert.equal(res.status, 401);
});

test("/api/my/analytics/artwork scopes to owned artist artworks", async () => {
  let queriedIds: string[] = [];
  const res = await handleGetMyArtworkAnalytics({
    requireAuth: async () => ({ id: "user-1" }),
    findOwnedArtistByUserId: async () => ({ id: "artist-1" }),
    listArtworksByArtistId: async () => [
      { id: "a-1", title: "A1", slug: "a1", isPublished: true },
      { id: "a-2", title: "A2", slug: null, isPublished: false },
    ],
    listArtworkViewDailyRows: async (artworkIds) => {
      queriedIds = artworkIds;
      return [{ entityId: "a-1", day: new Date(), views: 3 }];
    },
  });

  assert.equal(res.status, 200);
  assert.deepEqual(queriedIds, ["a-1", "a-2"]);
  const body = await res.json();
  assert.equal(body.totals.artworksTotal, 2);
  assert.equal(body.totals.artworksPublished, 1);
});

test("computeArtworkAnalytics calculates windows and top list", () => {
  const now = new Date("2026-02-21T12:00:00.000Z");
  const result = computeArtworkAnalytics(
    [
      { id: "a1", title: "Sun", slug: "sun", isPublished: true },
      { id: "a2", title: "Moon", slug: "moon", isPublished: false },
    ],
    [
      { entityId: "a1", day: new Date("2026-02-21T00:00:00.000Z"), views: 4 },
      { entityId: "a2", day: new Date("2026-02-15T00:00:00.000Z"), views: 6 },
      { entityId: "a1", day: new Date("2026-01-25T00:00:00.000Z"), views: 7 },
      { entityId: "a2", day: new Date("2025-10-10T00:00:00.000Z"), views: 99 },
    ],
    now,
  );

  assert.equal(result.views.last7, 10);
  assert.equal(result.views.last30, 17);
  assert.equal(result.views.last90, 17);
  assert.equal(result.views.top30[0].artworkId, "a1");
  assert.equal(result.views.top30[0].views, 11);
  assert.equal(result.views.top30[1].artworkId, "a2");
  assert.equal(result.views.top30[1].views, 6);
  assert.equal(result.views.daily30.length, 30);
});
