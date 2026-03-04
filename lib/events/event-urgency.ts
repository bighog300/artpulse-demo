export type EventUrgencyStatus = "happening_now" | "closing_soon" | "opening_soon";

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const CLOSING_SOON_WINDOW_MS = 48 * 60 * 60 * 1000;
const OPENING_SOON_WINDOW_MS = DAY_IN_MS;

function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isSameUtcDay(a: Date, b: Date): boolean {
  return a.getUTCFullYear() === b.getUTCFullYear() && a.getUTCMonth() === b.getUTCMonth() && a.getUTCDate() === b.getUTCDate();
}

export function getEventUrgencyStatus(startAt: string | Date, endAt?: string | Date | null, now: Date = new Date()): EventUrgencyStatus | null {
  const start = toDate(startAt);
  const end = toDate(endAt);

  if (!start) {
    return null;
  }

  const nowTime = now.getTime();
  const startTime = start.getTime();

  if ((startTime <= nowTime && end && end.getTime() > nowTime) || (!end && isSameUtcDay(start, now))) {
    return "happening_now";
  }

  if (end) {
    const timeUntilEnd = end.getTime() - nowTime;
    if (timeUntilEnd > 0 && timeUntilEnd <= CLOSING_SOON_WINDOW_MS) {
      return "closing_soon";
    }
  }

  const timeUntilStart = startTime - nowTime;
  if (timeUntilStart > 0 && timeUntilStart <= OPENING_SOON_WINDOW_MS) {
    return "opening_soon";
  }

  return null;
}
