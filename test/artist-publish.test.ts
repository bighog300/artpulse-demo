import test from "node:test";
import assert from "node:assert/strict";
import { getArtistPublishIssues } from "../lib/artist-publish.ts";

const baseArtist = {
  name: "Ari Chen",
  bio: "A multidisciplinary artist exploring memory, migration, and speculative architecture through mixed media.",
  websiteUrl: "https://ari.example",
  featuredAssetId: "11111111-1111-4111-8111-111111111111",
  featuredImageUrl: null,
  images: [{ id: "img-1" }],
};

test("getArtistPublishIssues returns issue for missing name", () => {
  const issues = getArtistPublishIssues({ ...baseArtist, name: "" });
  assert.equal(issues.some((issue) => issue.field === "name"), true);
});

test("getArtistPublishIssues returns issue for short bio", () => {
  const issues = getArtistPublishIssues({ ...baseArtist, bio: "short bio" });
  assert.equal(issues.some((issue) => issue.field === "bio"), true);
});

test("getArtistPublishIssues returns issue when no cover image exists", () => {
  const issues = getArtistPublishIssues({ ...baseArtist, featuredAssetId: null, featuredImageUrl: null, images: [] });
  assert.equal(issues.some((issue) => issue.field === "coverImage"), true);
});

test("getArtistPublishIssues returns no issues for valid artist", () => {
  const issues = getArtistPublishIssues(baseArtist);
  assert.deepEqual(issues, []);
});
