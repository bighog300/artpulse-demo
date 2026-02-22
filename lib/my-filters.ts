export type ArtworkFilter = "missingCover" | "draft" | undefined;

export function parseArtworkFilter(filter?: string): ArtworkFilter {
  if (filter === "missingCover" || filter === "draft") return filter;
  return undefined;
}

export type VenueFilter = "missingCover" | "needsEdits" | "submitted" | undefined;

export function parseVenueFilter(filter?: string): VenueFilter {
  if (filter === "missingCover" || filter === "needsEdits" || filter === "submitted") return filter;
  return undefined;
}

export type EventFilter = "missingVenue" | "draft" | undefined;

export function parseEventFilter(filter?: string): EventFilter {
  if (filter === "missingVenue" || filter === "draft") return filter;
  return undefined;
}
