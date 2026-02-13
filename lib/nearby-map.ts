export type NearbyView = "list" | "map";

export type NearbyEventItem = {
  id: string;
  slug: string;
  title: string;
  startAt: string;
  venueName?: string | null;
  lat?: number | null;
  lng?: number | null;
  mapLat?: number | null;
  mapLng?: number | null;
};

export type MarkerEvent = {
  id: string;
  slug: string;
  title: string;
  startAt: string;
  venueName: string | null;
  lat: number;
  lng: number;
};

export const MAX_MAP_MARKERS = 300;

export function resolveNearbyView(value: string | null | undefined): NearbyView {
  return value === "map" ? "map" : "list";
}

export function getMarkerEvents(events: NearbyEventItem[], maxMarkers = MAX_MAP_MARKERS) {
  const mapped = events
    .map<MarkerEvent | null>((event) => {
      const lat = event.mapLat ?? event.lat;
      const lng = event.mapLng ?? event.lng;
      if (typeof lat !== "number" || Number.isNaN(lat) || typeof lng !== "number" || Number.isNaN(lng)) {
        return null;
      }
      return {
        id: event.id,
        slug: event.slug,
        title: event.title,
        startAt: event.startAt,
        venueName: event.venueName ?? null,
        lat,
        lng,
      };
    })
    .filter((item): item is MarkerEvent => item != null);

  return {
    markers: mapped.slice(0, maxMarkers),
    omittedCount: Math.max(0, mapped.length - maxMarkers),
  };
}
