export function formatEventDateRange(start: string | Date, end?: string | Date | null, timeZone?: string) {
  const startDate = new Date(start);
  if (Number.isNaN(startDate.getTime())) return "TBA";

  const endDate = end ? new Date(end) : null;
  const dateFormatter = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    weekday: "short",
    ...(timeZone ? { timeZone } : {}),
  });
  const timeFormatter = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    ...(timeZone ? { timeZone } : {}),
  });

  if (!endDate || Number.isNaN(endDate.getTime())) {
    return `${dateFormatter.format(startDate)} · ${timeFormatter.format(startDate)}`;
  }

  const sameDay = startDate.toDateString() === endDate.toDateString();
  if (sameDay) {
    return `${dateFormatter.format(startDate)} · ${timeFormatter.format(startDate)} – ${timeFormatter.format(endDate)}`;
  }

  return `${dateFormatter.format(startDate)} ${timeFormatter.format(startDate)} – ${dateFormatter.format(endDate)} ${timeFormatter.format(endDate)}`;
}

export function formatEventDayMonth(start: string | Date, timeZone?: string) {
  const date = new Date(start);
  if (Number.isNaN(date.getTime())) return { day: "--", month: "TBA" };

  const day = new Intl.DateTimeFormat(undefined, {
    day: "2-digit",
    ...(timeZone ? { timeZone } : {}),
  }).format(date);

  const month = new Intl.DateTimeFormat(undefined, {
    month: "short",
    ...(timeZone ? { timeZone } : {}),
  }).format(date);

  return { day, month };
}
