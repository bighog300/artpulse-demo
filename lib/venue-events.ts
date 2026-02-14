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

export type VenueUpcomingEventLike = {
  venueId: string;
  slug: string;
  title: string;
  startAt: Date;
};

export function mapNextUpcomingEventByVenueId<T extends VenueUpcomingEventLike>(events: T[]) {
  const byVenueId = new Map<string, T>();
  for (const event of events) {
    const existing = byVenueId.get(event.venueId);
    if (!existing || event.startAt < existing.startAt) {
      byVenueId.set(event.venueId, event);
    }
  }
  return byVenueId;
}
