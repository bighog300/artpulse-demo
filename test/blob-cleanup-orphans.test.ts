import test from "node:test";
import assert from "node:assert/strict";
import { db } from "../lib/db";
import { runBlobCleanupOrphansJob } from "../lib/jobs/blob-cleanup-orphans";

test("blob cleanup dryRun skips deletes but writes audit", async () => {
  (db as any).eventImage = { findMany: async () => [] };
  (db as any).venueImage = { findMany: async () => [] };
  (db as any).artistImage = { findMany: async () => [] };
  (db as any).event = { findMany: async () => [] };
  (db as any).venue = { findMany: async () => [] };
  (db as any).artist = { findMany: async () => [] };
  (db as any).asset = { findMany: async () => [{ url: "https://a.public.blob.vercel-storage.com/1.jpg", createdAt: new Date("2024-01-01") }, { url: "https://example.com/x.jpg", createdAt: new Date("2024-01-01") }] };

  const audits: any[] = [];
  (db as any).adminAuditLog = { create: async ({ data }: any) => { audits.push(data); } };

  const result = await runBlobCleanupOrphansJob({ params: { dryRun: true, olderThanDays: 1, limit: 10 }, actorEmail: "admin@example.com" });

  assert.equal(result.metadata?.candidateCount, 1);
  assert.equal(audits.length, 1);
});
