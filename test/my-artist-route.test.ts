import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { handlePatchMyArtist } from "@/lib/my-artist-route";

test("my artist patch returns forbidden when no owned artist", async () => {
  const req = new NextRequest("http://localhost/api/my/artist", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "Updated" }),
  });

  const res = await handlePatchMyArtist(req, {
    requireAuth: async () => ({ id: "user-1" }),
    findOwnedArtistByUserId: async () => null,
    updateArtistById: async () => ({ id: "artist-1", name: "Updated", bio: null, websiteUrl: null, instagramUrl: null, avatarImageUrl: null }),
  });

  assert.equal(res.status, 403);
  const body = await res.json();
  assert.equal(body.error.code, "forbidden");
});
