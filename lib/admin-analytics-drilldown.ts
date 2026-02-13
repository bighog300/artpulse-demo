import type { Prisma } from "@prisma/client";

export type DrilldownTargetType = "EVENT" | "VENUE" | "ARTIST";
export type DrilldownMetric = "clicks" | "views";

type EngagementAction = "VIEW" | "CLICK";
type EngagementSurface = "DIGEST" | "NEARBY" | "SEARCH" | "FOLLOWING";

export type DrilldownEventRow = {
  action: EngagementAction;
  surface: EngagementSurface;
  createdAt: Date;
};

export type TopTargetGroupRow = {
  targetId: string | null;
  action: EngagementAction;
  _count: { _all: number };
};

export type TopTargetItem = {
  targetId: string;
  views: number;
  clicks: number;
  ctr: number;
  label?: string;
  href?: string;
};

export type DrilldownPayload = {
  windowDays: number;
  targetType: DrilldownTargetType;
  targetId: string;
  totals: { events: number; views: number; clicks: number; ctr: number };
  bySurface: Array<{ surface: EngagementSurface; views: number; clicks: number; ctr: number }>;
  byDay: Array<{ day: string; views: number; clicks: number }>;
  resolved: { label?: string; href?: string };
};

export type AdminDrilldownDb = {
  engagementEvent: {
    findMany: (args: Prisma.EngagementEventFindManyArgs) => Promise<Array<Pick<Prisma.EngagementEventGetPayload<{ select: { action: true; surface: true; createdAt: true } }>, "action" | "surface" | "createdAt">>>;
    groupBy: (args: Prisma.EngagementEventGroupByArgs) => Promise<Array<{ targetId?: string | null; action?: string; _count: { _all: number } }>>;
  };
  event: {
    findMany: (args: Prisma.EventFindManyArgs) => Promise<Array<{ id: string; title: string; slug: string }>>;
    findUnique: (args: Prisma.EventFindUniqueArgs) => Promise<{ title: string; slug: string } | null>;
  };
  venue: {
    findMany: (args: Prisma.VenueFindManyArgs) => Promise<Array<{ id: string; name: string; slug: string }>>;
    findUnique: (args: Prisma.VenueFindUniqueArgs) => Promise<{ name: string; slug: string } | null>;
  };
  artist: {
    findMany: (args: Prisma.ArtistFindManyArgs) => Promise<Array<{ id: string; name: string; slug: string }>>;
    findUnique: (args: Prisma.ArtistFindUniqueArgs) => Promise<{ name: string; slug: string } | null>;
  };
};

const SURFACES: EngagementSurface[] = ["DIGEST", "NEARBY", "SEARCH", "FOLLOWING"];
const DAY_MS = 24 * 60 * 60 * 1000;

function toDay(date: Date) {
  return date.toISOString().slice(0, 10);
}

function safeCtr(clicks: number, views: number) {
  return clicks / Math.max(views, 1);
}

export function aggregateDrilldown(windowDays: 7 | 30, targetType: DrilldownTargetType, targetId: string, events: DrilldownEventRow[]): DrilldownPayload {
  const totals = { events: events.length, views: 0, clicks: 0, ctr: 0 };
  const bySurfaceMap = new Map<EngagementSurface, { views: number; clicks: number }>();
  for (const surface of SURFACES) bySurfaceMap.set(surface, { views: 0, clicks: 0 });

  const cutoff = new Date(Date.now() - (windowDays - 1) * DAY_MS);
  cutoff.setUTCHours(0, 0, 0, 0);
  const byDayMap = new Map<string, { views: number; clicks: number }>();
  for (let idx = 0; idx < windowDays; idx += 1) {
    const day = new Date(cutoff.getTime() + idx * DAY_MS);
    byDayMap.set(toDay(day), { views: 0, clicks: 0 });
  }

  for (const event of events) {
    const bucket = bySurfaceMap.get(event.surface);
    const dayBucket = byDayMap.get(toDay(event.createdAt));

    if (event.action === "VIEW") {
      totals.views += 1;
      if (bucket) bucket.views += 1;
      if (dayBucket) dayBucket.views += 1;
    }
    if (event.action === "CLICK") {
      totals.clicks += 1;
      if (bucket) bucket.clicks += 1;
      if (dayBucket) dayBucket.clicks += 1;
    }
  }

  totals.ctr = safeCtr(totals.clicks, totals.views);

  return {
    windowDays,
    targetType,
    targetId,
    totals,
    bySurface: SURFACES.map((surface) => {
      const counts = bySurfaceMap.get(surface)!;
      return { surface, views: counts.views, clicks: counts.clicks, ctr: safeCtr(counts.clicks, counts.views) };
    }),
    byDay: Array.from(byDayMap.entries()).map(([day, counts]) => ({ day, views: counts.views, clicks: counts.clicks })),
    resolved: {},
  };
}

export function aggregateTopTargets(groups: TopTargetGroupRow[], metric: DrilldownMetric, limit: number): TopTargetItem[] {
  const map = new Map<string, { views: number; clicks: number }>();

  for (const row of groups) {
    if (!row.targetId) continue;
    const current = map.get(row.targetId) ?? { views: 0, clicks: 0 };
    if (row.action === "VIEW") current.views += row._count._all;
    if (row.action === "CLICK") current.clicks += row._count._all;
    map.set(row.targetId, current);
  }

  return Array.from(map.entries())
    .map(([targetId, counts]) => ({
      targetId,
      views: counts.views,
      clicks: counts.clicks,
      ctr: safeCtr(counts.clicks, counts.views),
    }))
    .sort((a, b) => {
      const primary = (b[metric] - a[metric]);
      if (primary !== 0) return primary;
      return b.clicks - a.clicks;
    })
    .slice(0, limit);
}

export async function resolveTarget(targetType: DrilldownTargetType, targetId: string, db: AdminDrilldownDb) {
  if (targetType === "EVENT") {
    const event = await db.event.findUnique({ where: { id: targetId }, select: { title: true, slug: true } });
    return event ? { label: event.title, href: `/events/${event.slug}` } : {};
  }
  if (targetType === "VENUE") {
    const venue = await db.venue.findUnique({ where: { id: targetId }, select: { name: true, slug: true } });
    return venue ? { label: venue.name, href: `/venues/${venue.slug}` } : {};
  }
  const artist = await db.artist.findUnique({ where: { id: targetId }, select: { name: true, slug: true } });
  return artist ? { label: artist.name, href: `/artists/${artist.slug}` } : {};
}

export async function resolveTargetMap(targetType: DrilldownTargetType, targetIds: string[], db: AdminDrilldownDb) {
  if (!targetIds.length) return new Map<string, { label?: string; href?: string }>();

  if (targetType === "EVENT") {
    const rows = await db.event.findMany({ where: { id: { in: targetIds } }, select: { id: true, title: true, slug: true } });
    return new Map(rows.map((row) => [row.id, { label: row.title, href: `/events/${row.slug}` }]));
  }

  if (targetType === "VENUE") {
    const rows = await db.venue.findMany({ where: { id: { in: targetIds } }, select: { id: true, name: true, slug: true } });
    return new Map(rows.map((row) => [row.id, { label: row.name, href: `/venues/${row.slug}` }]));
  }

  const rows = await db.artist.findMany({ where: { id: { in: targetIds } }, select: { id: true, name: true, slug: true } });
  return new Map(rows.map((row) => [row.id, { label: row.name, href: `/artists/${row.slug}` }]));
}

export async function getDrilldown(windowDays: 7 | 30, targetType: DrilldownTargetType, targetId: string, db: AdminDrilldownDb) {
  const since = new Date(Date.now() - windowDays * DAY_MS);
  const events = await db.engagementEvent.findMany({
    where: {
      createdAt: { gte: since },
      targetType,
      targetId,
      action: { in: ["VIEW", "CLICK"] },
    },
    select: { action: true, surface: true, createdAt: true },
  });

  const payload = aggregateDrilldown(windowDays, targetType, targetId, events as DrilldownEventRow[]);
  payload.resolved = await resolveTarget(targetType, targetId, db);
  return payload;
}

export async function getTopTargets(windowDays: 7 | 30, targetType: DrilldownTargetType, metric: DrilldownMetric, limit: number, db: AdminDrilldownDb) {
  const since = new Date(Date.now() - windowDays * DAY_MS);
  const grouped = await db.engagementEvent.groupBy({
    by: ["targetId", "action"],
    where: {
      createdAt: { gte: since },
      targetType,
      action: { in: ["VIEW", "CLICK"] },
    },
    _count: { _all: true },
  });

  const items = aggregateTopTargets(grouped as TopTargetGroupRow[], metric, limit);
  const resolved = await resolveTargetMap(targetType, items.map((item) => item.targetId), db);

  return {
    windowDays,
    targetType,
    metric,
    items: items.map((item) => ({ ...item, ...(resolved.get(item.targetId) ?? {}) })),
  };
}
