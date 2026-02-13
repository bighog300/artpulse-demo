import { z } from "zod";

export const digestSnapshotItemSchema = z.object({
  slug: z.string().trim().min(1),
  title: z.string().trim().min(1),
  startAt: z.iso.datetime({ offset: true }).or(z.iso.datetime({ local: true })),
  venueName: z.string().trim().min(1).nullable(),
});

export const digestSnapshotItemsSchema = z.array(digestSnapshotItemSchema);

export function isoWeekStamp(input: Date) {
  const d = new Date(Date.UTC(input.getUTCFullYear(), input.getUTCMonth(), input.getUTCDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

export function digestDedupeKey(savedSearchId: string, date: Date = new Date()) {
  return `digest:${savedSearchId}:${isoWeekStamp(date)}`;
}
