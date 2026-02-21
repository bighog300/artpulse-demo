import test from "node:test";
import assert from "node:assert/strict";
import { handleGetMyDashboard } from "@/lib/my-dashboard-route";

test("/api/my/dashboard requires auth", async () => {
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

test("/api/my/dashboard returns scoped stats and todo counts", async () => {
  const res = await handleGetMyDashboard({
    requireAuth: async () => ({ id: "user-1", role: "EDITOR" }),
    findOwnedArtistByUserId: async () => ({
      id: "artist-1",
      name: "Owner",
      slug: "owner",
      bio: null,
      websiteUrl: null,
      instagramUrl: null,
      featuredAssetId: null,
      avatarImageUrl: null,
      featuredAsset: null,
    }),
    listManagedVenuesByUserId: async () => [{ id: "v1", name: "Venue", slug: "venue", isPublished: true, featuredAsset: null, featuredImageUrl: null }],
    listArtworksByArtistId: async () => [
      { id: "a1", title: "Draft no cover", slug: "a1", isPublished: false, featuredAssetId: null, updatedAt: new Date("2026-02-19T00:00:00.000Z"), featuredAsset: null, images: [] },
      { id: "a2", title: "Published", slug: "a2", isPublished: true, featuredAssetId: "asset-1", updatedAt: new Date("2026-02-18T00:00:00.000Z"), featuredAsset: { url: "https://img/2.jpg" }, images: [{ id: "img1" }] },
    ],
    listEventsForDashboard: async () => [
      { id: "e1", slug: "event-1", title: "Event 1", startAt: new Date(Date.now() + 3 * 86_400_000), updatedAt: new Date(), venueId: null },
    ],
    listArtworkViewDailyRows: async () => [{ entityId: "a2", day: new Date(), views: 5 }],
  });

  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.stats.artworks.total, 2);
  assert.equal(body.stats.artworks.published, 1);
  assert.equal(body.stats.artworks.drafts, 1);

  const missingCover = body.todo.find((item: { id: string }) => item.id === "missing-cover");
  const draftTodo = body.todo.find((item: { id: string }) => item.id === "draft-artwork");
  assert.equal(missingCover?.count, 1);
  assert.equal(draftTodo?.count, 1);
});

test("/api/my/dashboard does not leak other artist artworks", async () => {
  let queriedArtistId = "";
  const res = await handleGetMyDashboard({
    requireAuth: async () => ({ id: "user-1" }),
    findOwnedArtistByUserId: async () => ({
      id: "artist-owned",
      name: "Owner",
      slug: "owner",
      bio: "bio",
      websiteUrl: "https://x.com",
      instagramUrl: null,
      featuredAssetId: "asset",
      avatarImageUrl: null,
      featuredAsset: { url: "https://img/avatar.jpg" },
    }),
    listManagedVenuesByUserId: async () => [],
    listArtworksByArtistId: async (artistId) => {
      queriedArtistId = artistId;
      return [{ id: "owned", title: "Owned", slug: "owned", isPublished: true, featuredAssetId: "asset", updatedAt: new Date(), featuredAsset: null, images: [] }];
    },
    listEventsForDashboard: async () => [],
    listArtworkViewDailyRows: async () => [],
  });

  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(queriedArtistId, "artist-owned");
  assert.equal(body.stats.artworks.total, 1);
  assert.equal(body.drafts.artworks.length, 0);
});
