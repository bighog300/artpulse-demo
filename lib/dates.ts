const EVENT_DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

const EVENT_TIME_FORMATTER = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: "UTC",
});

export function formatEventDateLabel(startAt: Date): string {
  return EVENT_DATE_FORMATTER.format(startAt);
}

export function formatEventDateTimeRange(startAt: Date, endAt?: Date | null): string {
  const startDate = formatEventDateLabel(startAt);
  const startTime = EVENT_TIME_FORMATTER.format(startAt);

  if (!endAt) {
    return `Starts ${startDate} at ${startTime} UTC`;
  }

  const endDate = formatEventDateLabel(endAt);
  const endTime = EVENT_TIME_FORMATTER.format(endAt);

  if (startDate === endDate) {
    return `${startDate}, ${startTime}–${endTime} UTC`;
  }

  return `${startDate}, ${startTime} UTC – ${endDate}, ${endTime} UTC`;
}
