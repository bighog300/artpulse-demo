import test from "node:test";
import assert from "node:assert/strict";
import { collectGeoFilteredPage, type StartAtCursor } from "../lib/events-geo-pagination";

type Row = { id: string; startAt: Date; inRadius: boolean };

function row(id: string, day: number, inRadius: boolean): Row {
  return { id, startAt: new Date(`2026-01-${String(day).padStart(2, "0")}T00:00:00.000Z`), inRadius };
}

test("geo pagination overfetches and keeps hasMore true when first batch underfills after filtering", async () => {
  const dataset: Row[] = [
    row("a", 1, false),
    row("b", 2, true),
    row("c", 3, false),
    row("d", 4, false),
    row("e", 5, true),
    row("f", 6, true),
    row("g", 7, true),
  ];

  const fetchBatch = async (cursor: StartAtCursor | null, take: number) => {
    const start = cursor ? dataset.findIndex((item) => item.id === cursor.id) + 1 : 0;
    return dataset.slice(start, start + take);
  };

  const result = await collectGeoFilteredPage({
    limit: 3,
    initialCursor: null,
    fetchBatch,
    toCursor: (item) => ({ id: item.id, startAt: item.startAt }),
    isMatch: (item) => item.inRadius,
  });

  assert.deepEqual(result.page.map((item) => item.id), ["b", "e", "f"]);
  assert.equal(result.hasMore, true);
  assert.equal(result.nextCursor?.id, "f");
});
