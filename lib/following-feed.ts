export type FollowingFeedTypeFilter = "both" | "artist" | "venue";

export type FollowingFeedItem = {
  id: string;
  slug: string;
  title: string;
  startAt: Date;
  endAt: Date | null;
  venue: { name: string; slug: string } | null;
};

export async function getFollowingFeedWithDeps(
  deps: {
    now: () => Date;
    findFollows: (userId: string) => Promise<Array<{ targetType: "ARTIST" | "VENUE"; targetId: string }>>;
    findEvents: (args: {
      artistIds: string[];
      venueIds: string[];
      from: Date;
      to: Date;
      cursor?: string;
      limit: number;
    }) => Promise<FollowingFeedItem[]>;
  },
  args: {
    userId: string;
    days: 7 | 30;
    type: FollowingFeedTypeFilter;
    cursor?: string;
    limit: number;
  },
) {
  const follows = await deps.findFollows(args.userId);
  const allArtistIds = follows.filter((f) => f.targetType === "ARTIST").map((f) => f.targetId);
  const allVenueIds = follows.filter((f) => f.targetType === "VENUE").map((f) => f.targetId);

  const artistIds = args.type === "venue" ? [] : allArtistIds;
  const venueIds = args.type === "artist" ? [] : allVenueIds;

  if (!artistIds.length && !venueIds.length) {
    return { items: [] as FollowingFeedItem[], nextCursor: null as string | null };
  }

  const from = deps.now();
  const to = new Date(from.getTime() + args.days * 24 * 60 * 60 * 1000);
  const results = await deps.findEvents({
    artistIds,
    venueIds,
    from,
    to,
    cursor: args.cursor,
    limit: args.limit + 1,
  });

  const hasMore = results.length > args.limit;
  const page = hasMore ? results.slice(0, args.limit) : results;

  return {
    items: page,
    nextCursor: hasMore ? page[page.length - 1].id : null,
  };
}
