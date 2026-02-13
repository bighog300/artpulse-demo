import type { Prisma } from "@prisma/client";

export type AdminAnalyticsDb = {
  engagementEvent: {
    count: (args?: Prisma.EngagementEventCountArgs) => Promise<number>;
    groupBy: (args: Prisma.EngagementEventGroupByArgs) => Promise<Array<{ targetId?: string | null; userId?: string | null; sessionId?: string | null; _count: { _all: number } }>>;
  };
};

export type AnalyticsOverview = {
  windowDays: number;
  totals: {
    eventsTracked: number;
    uniqueUsers: number;
    uniqueSessions: number;
    digestsViewed: number;
    digestClicks: number;
    nearbyClicks: number;
    searchClicks: number;
    followingClicks: number;
    follows: number;
    saveSearches: number;
  };
  ctr: {
    digestCtr: number | null;
    nearbyCtr: number | null;
    searchCtr: number | null;
  };
  top: {
    events: Array<{ eventId: string; clicks: number }>;
    venues: Array<{ venueId: string; clicks: number }>;
    artists: Array<{ artistId: string; clicks: number }>;
  };
};

const safeCtr = (clicks: number, views: number) => (views > 0 ? clicks / views : null);

export async function getAdminAnalyticsOverview(windowDays: 7 | 30, analyticsDb: AdminAnalyticsDb): Promise<AnalyticsOverview> {
  const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);
  const rangeWhere = { createdAt: { gte: since } };

  const [
    eventsTracked,
    uniqueUsers,
    uniqueSessions,
    digestsViewed,
    digestClicks,
    nearbyClicks,
    searchClicks,
    followingClicks,
    follows,
    saveSearches,
    eventGroups,
    venueGroups,
    artistGroups,
  ] = await Promise.all([
    analyticsDb.engagementEvent.count({ where: rangeWhere }),
    analyticsDb.engagementEvent.groupBy({ by: ["userId"], where: { ...rangeWhere, userId: { not: null } }, _count: { _all: true } }),
    analyticsDb.engagementEvent.groupBy({ by: ["sessionId"], where: { ...rangeWhere, sessionId: { not: null } }, _count: { _all: true } }),
    analyticsDb.engagementEvent.count({ where: { ...rangeWhere, action: "VIEW", targetType: "DIGEST_RUN" } }),
    analyticsDb.engagementEvent.count({ where: { ...rangeWhere, action: "CLICK", targetType: "EVENT", surface: "DIGEST" } }),
    analyticsDb.engagementEvent.count({ where: { ...rangeWhere, action: "CLICK", targetType: "EVENT", surface: "NEARBY" } }),
    analyticsDb.engagementEvent.count({ where: { ...rangeWhere, action: "CLICK", targetType: "EVENT", surface: "SEARCH" } }),
    analyticsDb.engagementEvent.count({ where: { ...rangeWhere, action: "CLICK", targetType: "EVENT", surface: "FOLLOWING" } }),
    analyticsDb.engagementEvent.count({ where: { ...rangeWhere, action: "FOLLOW", targetType: { in: ["VENUE", "ARTIST"] } } }),
    analyticsDb.engagementEvent.count({ where: { ...rangeWhere, action: "SAVE_SEARCH", targetType: "SAVED_SEARCH" } }),
    analyticsDb.engagementEvent.groupBy({
      by: ["targetId"],
      where: { ...rangeWhere, action: "CLICK", targetType: "EVENT" },
      _count: { _all: true },
      orderBy: { _count: { targetId: "desc" } },
      take: 10,
    }),
    analyticsDb.engagementEvent.groupBy({
      by: ["targetId"],
      where: { ...rangeWhere, action: "CLICK", targetType: "VENUE" },
      _count: { _all: true },
      orderBy: { _count: { targetId: "desc" } },
      take: 10,
    }),
    analyticsDb.engagementEvent.groupBy({
      by: ["targetId"],
      where: { ...rangeWhere, action: "CLICK", targetType: "ARTIST" },
      _count: { _all: true },
      orderBy: { _count: { targetId: "desc" } },
      take: 10,
    }),
  ]);

  return {
    windowDays,
    totals: {
      eventsTracked,
      uniqueUsers: uniqueUsers.length,
      uniqueSessions: uniqueSessions.length,
      digestsViewed,
      digestClicks,
      nearbyClicks,
      searchClicks,
      followingClicks,
      follows,
      saveSearches,
    },
    ctr: {
      digestCtr: safeCtr(digestClicks, digestsViewed),
      nearbyCtr: safeCtr(nearbyClicks, digestsViewed),
      searchCtr: safeCtr(searchClicks, digestsViewed),
    },
    top: {
      events: eventGroups.filter((item) => typeof item.targetId === "string").map((item) => ({ eventId: item.targetId!, clicks: item._count._all })),
      venues: venueGroups.filter((item) => typeof item.targetId === "string").map((item) => ({ venueId: item.targetId!, clicks: item._count._all })),
      artists: artistGroups.filter((item) => typeof item.targetId === "string").map((item) => ({ artistId: item.targetId!, clicks: item._count._all })),
    },
  };
}
