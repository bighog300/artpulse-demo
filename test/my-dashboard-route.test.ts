import test from "node:test";
import assert from "node:assert/strict";
import { handleGetMyDashboard } from "@/lib/my-dashboard-route";

test("/api/my/dashboard returns 401 when unauthenticated", async () => {
  const res = await handleGetMyDashboard({
    requireAuth: async () => {
      throw new Error("unauthorized");
    },
    findOwnedArtistByUserId: async () => null,
    listManagedVenuesByUserId: async () => [],
    listArtworksByArtistId: async () => [],
    listEventsForDashboard: async () => [],
    listArtworkViewDailyRows: async () => [],
  });

  assert.equal(res.status, 401);
});

test("/api/my/dashboard returns onboarding payload when user has no artist context", async () => {
  const res = await handleGetMyDashboard({
    requireAuth: async () => ({ id: "user-1" }),
    findOwnedArtistByUserId: async () => null,
    listManagedVenuesByUserId: async () => [],
    listArtworksByArtistId: async () => [],
    listEventsForDashboard: async () => [],
    listArtworkViewDailyRows: async () => [],
  });

  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.needsOnboarding, true);
  assert.equal(body.nextHref, "/my/artist");
});

test("/api/my/dashboard scopes only owned artist data and computes todos/views/top correctly", async () => {
  const now = new Date();
  const day = (daysAgo: number) => new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - daysAgo));

  const res = await handleGetMyDashboard({
    requireAuth: async () => ({ id: "user-1", role: "EDITOR" }),
    findOwnedArtistByUserId: async () => ({
      id: "artist-owned",
      name: "Owner",
      slug: "owner",
      bio: null,
      websiteUrl: null,
      instagramUrl: null,
      featuredAssetId: null,
      avatarImageUrl: null,
      featuredAsset: null,
    }),
    listManagedVenuesByUserId: async () => [{ id: "venue-1" }],
    listArtworksByArtistId: async (artistId) => {
      assert.equal(artistId, "artist-owned");
      return [
        { id: "a1", title: "Draft no cover", slug: "a1", isPublished: false, featuredAssetId: null, updatedAt: day(1), featuredAsset: null, images: [] },
        { id: "a2", title: "Published 1", slug: "a2", isPublished: true, featuredAssetId: "asset-1", updatedAt: day(2), featuredAsset: { url: "https://img/2.jpg" }, images: [{ id: "img-a2", asset: { url: "https://img/2.jpg" } }] },
        { id: "a3", title: "Published 2", slug: "a3", isPublished: true, featuredAssetId: null, updatedAt: day(3), featuredAsset: null, images: [{ id: "img-a3", asset: { url: "https://img/3.jpg" } }] },
      ];
    },
    listEventsForDashboard: async () => [
      { id: "e1", slug: "event-1", title: "Event 1", startAt: day(-2), updatedAt: day(0), venueId: null },
    ],
    listArtworkViewDailyRows: async () => [
      { entityId: "a2", day: day(0), views: 10 },
      { entityId: "a2", day: day(5), views: 4 },
      { entityId: "a3", day: day(20), views: 8 },
      { entityId: "a3", day: day(40), views: 6 },
    ],
  });

  assert.equal(res.status, 200);
  const body = await res.json();

  assert.equal(body.stats.artworks.total, 3);
  assert.equal(body.stats.artworks.drafts, 1);
  assert.equal(body.stats.artworks.missingCover, 1);
  assert.equal(body.stats.views.last30, 22);
  assert.equal(body.stats.views.last7, 14);
  assert.equal(body.stats.views.last90, 28);
  assert.equal(body.topArtworks30.length, 2);
  assert.equal(body.topArtworks30[0].id, "a2");

  const missingCover = body.todo.find((item: { id: string }) => item.id === "missing-image");
  const draftTodo = body.todo.find((item: { id: string }) => item.id === "draft-artwork");
  assert.equal(missingCover?.count, 1);
  assert.equal(draftTodo?.count, 1);
});
