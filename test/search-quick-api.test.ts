import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { db } from "../lib/db.ts";
import { GET as searchQuick } from "../app/api/search/quick/route.ts";

test("GET /api/search/quick returns empty payload for invalid query", async () => {
  const req = new NextRequest("http://localhost/api/search/quick?q=a");
  const res = await searchQuick(req);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { events: [], venues: [], artists: [] });
});

test("GET /api/search/quick returns empty payload when DB is unavailable", async () => {
  const originalEventFindMany = db.event.findMany;
  const originalVenueFindMany = db.venue.findMany;
  const originalArtistFindMany = db.artist.findMany;

  db.event.findMany = (async () => {
    throw new Error("db down");
  }) as typeof db.event.findMany;
  db.venue.findMany = (async () => {
    throw new Error("db down");
  }) as typeof db.venue.findMany;
  db.artist.findMany = (async () => {
    throw new Error("db down");
  }) as typeof db.artist.findMany;

  try {
    const req = new NextRequest("http://localhost/api/search/quick?q=gallery");
    const res = await searchQuick(req);
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { events: [], venues: [], artists: [] });
  } finally {
    db.event.findMany = originalEventFindMany;
    db.venue.findMany = originalVenueFindMany;
    db.artist.findMany = originalArtistFindMany;
  }
});
