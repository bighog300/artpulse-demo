export type FollowingFeedTypeFilter = "both" | "artist" | "venue";

export type FollowingFeedItem = {
  id: string;
  slug: string;
  title: string;
  startAt: Date;
  endAt: Date | null;
  venue: { name: string; slug: string } | null;
};

function encodeCursor(item: Pick<FollowingFeedItem, "id" | "startAt">) {
  return Buffer.from(JSON.stringify({ id: item.id, startAt: item.startAt.toISOString() })).toString("base64url");
}

function decodeCursor(cursor: string) {
  try {
    const parsed = JSON.parse(Buffer.from(cursor, "base64url").toString("utf-8")) as { id?: string; startAt?: string };
    if (!parsed.id || !parsed.startAt) return null;
    const startAt = new Date(parsed.startAt);
    if (Number.isNaN(startAt.getTime())) return null;
    return { id: parsed.id, startAt };
  } catch {
    return null;
  }
}

export async function getFollowingFeedWithDeps(
  deps: {
    now: () => Date;
    findFollows: (userId: string) => Promise<Array<{ targetType: "ARTIST" | "VENUE"; targetId: string }>>;
    findEvents: (args: {
      artistIds: string[];
      venueIds: string[];
      from: Date;
      to: Date;
      cursor?: { id: string; startAt: Date };
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
  const decodedCursor = args.cursor ? decodeCursor(args.cursor) : undefined;

  const results = await deps.findEvents({
    artistIds,
    venueIds,
    from,
    to,
    cursor: decodedCursor ?? undefined,
    limit: args.limit + 1,
  });

  const hasMore = results.length > args.limit;
  const page = hasMore ? results.slice(0, args.limit) : results;

  return {
    items: page,
    nextCursor: hasMore ? encodeCursor(page[page.length - 1]) : null,
  };
}
