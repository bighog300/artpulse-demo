import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { handlePostMyArtist } from "@/lib/my-artist-create-route";

test("creates artist when none exists with draft submission", async () => {
  const artists: Array<{ id: string; userId: string; name: string; slug: string; isPublished: boolean }> = [];
  const submissions: Array<{ artistId: string; userId: string; status: string; kind: string }> = [];

  const req = new NextRequest("http://localhost/api/my/artist", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "John Doe" }),
  });

  const res = await handlePostMyArtist(req, {
    requireAuth: async () => ({ id: "user-1" }),
    findOwnedArtistByUserId: async (userId) => artists.find((artist) => artist.userId === userId) ?? null,
    findArtistBySlug: async (slug) => artists.find((artist) => artist.slug === slug) ?? null,
    createArtist: async (data) => {
      const artist = { id: "artist-1", userId: data.userId, name: data.name, slug: data.slug, isPublished: false };
      artists.push(artist);
      return { id: artist.id, slug: artist.slug };
    },
    upsertArtistSubmission: async (artistId, userId) => {
      submissions.push({ artistId, userId, status: "DRAFT", kind: "PUBLISH" });
    },
    setOnboardingFlag: async () => undefined,
  });

  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.ok, true);
  assert.equal(body.slug, "john-doe");
  assert.equal(artists.length, 1);
  assert.equal(artists[0]?.isPublished, false);
  assert.deepEqual(submissions[0], { artistId: "artist-1", userId: "user-1", status: "DRAFT", kind: "PUBLISH" });
});

test("is idempotent when user already has artist", async () => {
  let createCalls = 0;
  const req = new NextRequest("http://localhost/api/my/artist", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "Existing" }),
  });

  const deps = {
    requireAuth: async () => ({ id: "user-1" }),
    findOwnedArtistByUserId: async () => ({ id: "artist-1", slug: "existing" }),
    findArtistBySlug: async () => null,
    createArtist: async () => {
      createCalls += 1;
      return { id: "artist-2", slug: "existing-2" };
    },
    upsertArtistSubmission: async () => undefined,
    setOnboardingFlag: async () => undefined,
  };

  const first = await handlePostMyArtist(req, deps);
  const second = await handlePostMyArtist(req, deps);

  assert.equal(first.status, 200);
  assert.equal(second.status, 200);
  assert.equal(createCalls, 0);
  const body = await second.json();
  assert.equal(body.artistId, "artist-1");
});

test("validates name length", async () => {
  const req = new NextRequest("http://localhost/api/my/artist", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "A" }),
  });

  const res = await handlePostMyArtist(req, {
    requireAuth: async () => ({ id: "user-1" }),
    findOwnedArtistByUserId: async () => null,
    findArtistBySlug: async () => null,
    createArtist: async () => ({ id: "artist-1", slug: "a" }),
    upsertArtistSubmission: async () => undefined,
    setOnboardingFlag: async () => undefined,
  });

  assert.equal(res.status, 400);
});

test("handles slug collisions deterministically", async () => {
  const artists = [{ id: "artist-existing", slug: "john-doe" }];
  const req = new NextRequest("http://localhost/api/my/artist", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "John Doe" }),
  });

  const res = await handlePostMyArtist(req, {
    requireAuth: async () => ({ id: "user-2" }),
    findOwnedArtistByUserId: async () => null,
    findArtistBySlug: async (slug) => artists.find((artist) => artist.slug === slug) ?? null,
    createArtist: async (data) => ({ id: "artist-2", slug: data.slug }),
    upsertArtistSubmission: async () => undefined,
    setOnboardingFlag: async () => undefined,
  });

  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.slug, "john-doe-2");
});
