export type VenueEventLike = {
  startAt: Date;
};

export function splitVenueEvents<T extends VenueEventLike>(events: T[], now: Date) {
  const upcoming = events
    .filter((event) => event.startAt >= now)
    .sort((a, b) => a.startAt.getTime() - b.startAt.getTime());

  const past = events
    .filter((event) => event.startAt < now)
    .sort((a, b) => b.startAt.getTime() - a.startAt.getTime());

  return { upcoming, past };
}
