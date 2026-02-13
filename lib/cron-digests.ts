import { Prisma } from "@prisma/client";
import { digestDedupeKey, digestSnapshotItemsSchema, isoWeekStamp } from "@/lib/digest";
import { runSavedSearchEvents } from "@/lib/saved-searches";
import { applyConservativeRanking, computeEngagementBoosts } from "@/lib/ranking";

export type DigestDb = {
  savedSearch: {
    findMany: (args: Prisma.SavedSearchFindManyArgs) => Promise<Array<{ id: string; userId: string; name: string; type: "NEARBY" | "EVENTS_FILTER"; paramsJson: Prisma.JsonValue; lastSentAt: Date | null }>>;
    update: (args: Prisma.SavedSearchUpdateArgs) => Promise<unknown>;
  };
  digestRun: {
    upsert: (args: Prisma.DigestRunUpsertArgs) => Promise<{ id: string }>;
  };
  notification: { upsert: (args: Prisma.NotificationUpsertArgs) => Promise<unknown> };
  engagementEvent?: {
    findMany: (args: Prisma.EngagementEventFindManyArgs) => Promise<Array<{ targetId: string }>>;
  };
  event: { findMany: (args: Prisma.EventFindManyArgs) => Promise<Array<{ id: string; title: string; slug: string; startAt: Date; lat: number | null; lng: number | null; venueId: string | null; venue: { name: string; slug: string; city: string | null; lat: number | null; lng: number | null } | null; eventTags: Array<{ tag: { name: string; slug: string } }>; eventArtists: Array<{ artistId: string }> }>> };
};

export async function runWeeklyDigests(headerSecret: string | null, digestDb: DigestDb) {
  const configuredSecret = process.env.CRON_SECRET;
  if (!configuredSecret) return Response.json({ error: { code: "misconfigured", message: "CRON_SECRET is not configured", details: undefined } }, { status: 500 });
  if (headerSecret !== configuredSecret) return Response.json({ error: { code: "unauthorized", message: "Invalid cron secret", details: undefined } }, { status: 401 });

  const now = new Date();
  const periodKey = isoWeekStamp(now);
  const threshold = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000);
  const savedSearches = await digestDb.savedSearch.findMany({
    where: { isEnabled: true, frequency: "WEEKLY", OR: [{ lastSentAt: null }, { lastSentAt: { lt: threshold } }] },
    take: 25,
    orderBy: [{ lastSentAt: "asc" }, { createdAt: "asc" }],
  });

  let processed = 0;
  let sent = 0;
  let skipped = 0;

  for (const search of savedSearches) {
    processed += 1;
    const events = await runSavedSearchEvents({ eventDb: digestDb, type: search.type, paramsJson: search.paramsJson, limit: 10 });
    const boosts = digestDb.engagementEvent ? await computeEngagementBoosts(digestDb as never, search.userId, events) : new Map<string, number>();
    const page = applyConservativeRanking(events, boosts).slice(0, 10);
    if (!page.length) {
      skipped += 1;
      continue;
    }

    const snapshotItems = digestSnapshotItemsSchema.parse(page.map((event) => ({
      slug: event.slug,
      title: event.title,
      startAt: event.startAt.toISOString(),
      venueName: event.venue?.name ?? null,
    })));

    const digestRun = await digestDb.digestRun.upsert({
      where: { savedSearchId_periodKey: { savedSearchId: search.id, periodKey } },
      update: {
        itemCount: snapshotItems.length,
        itemsJson: snapshotItems,
      },
      create: {
        savedSearchId: search.id,
        userId: search.userId,
        periodKey,
        itemCount: snapshotItems.length,
        itemsJson: snapshotItems,
      },
      select: { id: true },
    });

    const dedupeKey = digestDedupeKey(search.id, now);
    await digestDb.notification.upsert({
      where: { dedupeKey },
      update: {},
      create: {
        userId: search.userId,
        type: "DIGEST_READY",
        title: "Your weekly Artpulse digest",
        body: `${page.length} upcoming events match '${search.name}'`,
        href: `/digests/${digestRun.id}`,
        dedupeKey,
      },
    });
    await digestDb.savedSearch.update({ where: { id: search.id }, data: { lastSentAt: now } });
    sent += 1;
  }

  return Response.json({ processed, sent, skipped });
}
