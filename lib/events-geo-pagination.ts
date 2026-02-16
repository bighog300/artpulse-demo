export type StartAtCursor = { id: string; startAt: Date };

const GEO_FETCH_MULTIPLIER = 3;
const GEO_MAX_TAKE = 200;
const GEO_MAX_ITERATIONS = 3;

export function getGeoFetchTake(limit: number) {
  return Math.min((limit * GEO_FETCH_MULTIPLIER) + 1, GEO_MAX_TAKE);
}

export async function collectGeoFilteredPage<T>(args: {
  limit: number;
  initialCursor: StartAtCursor | null;
  fetchBatch: (cursor: StartAtCursor | null, take: number) => Promise<T[]>;
  toCursor: (item: T) => StartAtCursor;
  isMatch: (item: T) => boolean;
}) {
  const take = getGeoFetchTake(args.limit);
  let cursor = args.initialCursor;
  let exhausted = false;
  let iterations = 0;
  const collected: T[] = [];

  while (iterations < GEO_MAX_ITERATIONS) {
    const batch = await args.fetchBatch(cursor, take);
    if (!batch.length) {
      exhausted = true;
      break;
    }

    collected.push(...batch);
    cursor = args.toCursor(batch[batch.length - 1]);
    iterations += 1;

    const filteredCount = collected.filter(args.isMatch).length;
    if (filteredCount > args.limit) break;
    if (batch.length < take) {
      exhausted = true;
      break;
    }
  }

  const filtered = collected.filter(args.isMatch);
  const hasMore = filtered.length > args.limit || (!exhausted && filtered.length > 0);
  const page = hasMore ? filtered.slice(0, args.limit) : filtered;

  return {
    page,
    hasMore,
    nextCursor: hasMore && page.length > 0 ? args.toCursor(page[page.length - 1]) : null,
  };
}
