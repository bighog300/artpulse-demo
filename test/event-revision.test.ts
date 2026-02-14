import test from "node:test";
import assert from "node:assert/strict";
import { applyEventRevision, buildEventRevisionSnapshot, sanitizeRevisionPatch } from "../lib/event-revision.ts";

test("sanitizeRevisionPatch rejects invalid dates", () => {
  assert.throws(() => sanitizeRevisionPatch({ startAt: "2026-01-02T10:00:00.000Z", endAt: "2026-01-01T10:00:00.000Z" }));
});

test("sanitizeRevisionPatch rejects invalid urls", () => {
  assert.throws(() => sanitizeRevisionPatch({ ticketUrl: "ftp://bad" }));
});

test("applyEventRevision allowlist excludes privileged fields", () => {
  const applied = applyEventRevision({ title: "Next", isPublished: false, venueId: "x" } as Record<string, unknown>);
  assert.equal((applied as { title: string }).title, "Next");
  assert.equal(Object.prototype.hasOwnProperty.call(applied, "isPublished"), false);
  assert.equal(Object.prototype.hasOwnProperty.call(applied, "venueId"), false);
});

test("buildEventRevisionSnapshot merges allowed fields", () => {
  const snap = buildEventRevisionSnapshot({
    title: "Old",
    description: "Long long description old",
    startAt: new Date("2026-01-01T10:00:00.000Z"),
    endAt: null,
    ticketUrl: null,
  }, {
    title: "New",
    ticketUrl: "https://example.com",
  });
  assert.equal(snap.title, "New");
  assert.equal(snap.ticketUrl, "https://example.com");
});
