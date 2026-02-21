import { db } from "@/lib/db";
import { deleteBlobByUrl, isVercelBlobUrl } from "@/lib/blob-delete";

type CleanupParams = {
  dryRun?: boolean;
  limit?: number;
  olderThanDays?: number;
};

function parseParams(params: unknown): Required<CleanupParams> {
  const input = (params && typeof params === "object") ? params as CleanupParams : {};
  return {
    dryRun: input.dryRun ?? true,
    limit: Math.min(Math.max(input.limit ?? 100, 1), 500),
    olderThanDays: Math.min(Math.max(input.olderThanDays ?? 2, 1), 365),
  };
}

function addUrl(set: Set<string>, url: string | null | undefined) {
  if (!url || !isVercelBlobUrl(url)) return;
  set.add(url);
}

export async function runBlobCleanupOrphansJob(input: { params?: unknown; actorEmail?: string | null }) {
  const parsed = parseParams(input.params);
  const cutoff = new Date(Date.now() - parsed.olderThanDays * 24 * 60 * 60 * 1000);

  const [eventImages, venueImages, artistImages, assets, featuredVenues, featuredArtists] = await Promise.all([
    db.eventImage.findMany({ select: { url: true } }),
    db.venueImage.findMany({ select: { url: true } }),
    db.artistImage.findMany({ select: { url: true } }),
    db.asset.findMany({ where: { createdAt: { lt: cutoff } }, select: { url: true, createdAt: true } }),
    db.venue.findMany({ where: { featuredImageUrl: { not: null } }, select: { featuredImageUrl: true } }),
    db.artist.findMany({ where: { featuredImageUrl: { not: null } }, select: { featuredImageUrl: true } }),
  ]);

  const externallyReferenced = new Set<string>();
  for (const row of eventImages) addUrl(externallyReferenced, row.url);
  for (const row of venueImages) addUrl(externallyReferenced, row.url);
  for (const row of artistImages) addUrl(externallyReferenced, row.url);
  for (const row of featuredVenues) addUrl(externallyReferenced, row.featuredImageUrl);
  for (const row of featuredArtists) addUrl(externallyReferenced, row.featuredImageUrl);

  const candidates = assets.map((asset) => asset.url).filter((url) => isVercelBlobUrl(url) && !externallyReferenced.has(url)).slice(0, parsed.limit);

  let deletedCount = 0;
  let failedCount = 0;
  const sampleFailures: string[] = [];

  for (const url of candidates) {
    try {
      if (!parsed.dryRun) await deleteBlobByUrl(url);
      deletedCount += parsed.dryRun ? 0 : 1;
      await db.adminAuditLog.create({
        data: {
          actorEmail: input.actorEmail ?? "system",
          action: "admin.blob.delete",
          targetType: "asset",
          targetId: null,
          metadata: { url, dryRun: parsed.dryRun },
        },
      });
    } catch (error) {
      failedCount += 1;
      if (sampleFailures.length < 10) sampleFailures.push(error instanceof Error ? error.message : "unknown_error");
    }
  }

  return {
    message: parsed.dryRun ? "blob cleanup dry-run completed" : "blob cleanup completed",
    metadata: {
      dryRun: parsed.dryRun,
      scannedCount: assets.length,
      candidateCount: candidates.length,
      deletedCount,
      failedCount,
      olderThanDays: parsed.olderThanDays,
      sampleFailures,
    },
  };
}
