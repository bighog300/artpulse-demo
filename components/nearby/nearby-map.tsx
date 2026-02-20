"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { EventPreviewCard } from "@/components/nearby/event-preview-card";
import { getMarkerEvents, MAX_MAP_MARKERS, type MarkerEvent, type NearbyEventItem } from "@/lib/nearby-map";

type NearbyMapProps = {
  events: NearbyEventItem[];
  lat: string;
  lng: string;
  radiusKm: string;
  days: number;
  onSearchArea: (center: { lat: number; lng: number }) => Promise<void>;
};

export function NearbyMap({ events, lat, lng, radiusKm, days, onSearchArea }: NearbyMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<unknown>(null);
  const markerRefs = useRef<Array<{ remove: () => void }>>([]);
  const [selected, setSelected] = useState<MarkerEvent | null>(null);
  const [isSearchingArea, setIsSearchingArea] = useState(false);
  const [isMapboxUnavailable, setIsMapboxUnavailable] = useState(false);
  const mapToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

  const { markers, omittedCount } = useMemo(() => getMarkerEvents(events), [events]);

  const fitToResults = () => {
    const map = mapRef.current as { fitBounds?: (bounds: unknown, opts?: { padding?: number; maxZoom?: number }) => void } | null;
    if (!map?.fitBounds || markers.length === 0) return;
    import("mapbox-gl").then((mb) => {
      const mapboxgl = mb.default ?? mb;
      const bounds = new mapboxgl.LngLatBounds();
      markers.forEach((markerEvent) => bounds.extend([markerEvent.lng, markerEvent.lat]));
      if (!bounds.isEmpty()) map.fitBounds?.(bounds, { padding: 40, maxZoom: 12 });
    }).catch(() => {
      // noop
    });
  };


  useEffect(() => {
    if (typeof window === "undefined" || !mapToken || !mapContainerRef.current || markers.length === 0) return;

    setIsMapboxUnavailable(false);

    let isCancelled = false;

    void (async () => {
      try {
        const mb = await import("mapbox-gl");
        if (isCancelled) return;
        const mapboxgl = mb.default ?? mb;
        mapboxgl.accessToken = mapToken;

        const fallbackCenter: [number, number] = [markers[0].lng, markers[0].lat];
        const numericLat = Number.parseFloat(lat);
        const numericLng = Number.parseFloat(lng);
        const center: [number, number] = Number.isFinite(numericLat) && Number.isFinite(numericLng)
          ? [numericLng, numericLat]
          : fallbackCenter;

        const map = new mapboxgl.Map({
          container: mapContainerRef.current as HTMLDivElement,
          style: "mapbox://styles/mapbox/streets-v12",
          center,
          zoom: 10,
        });

        mapRef.current = map;

        const bounds = new mapboxgl.LngLatBounds();
        markers.forEach((markerEvent) => {
          const el = document.createElement("button");
          el.type = "button";
          el.className = "h-3 w-3 rounded-full border border-gray-900 bg-blue-500";
          el.setAttribute("aria-label", `Show ${markerEvent.title}`);

          const marker = new mapboxgl.Marker({ element: el })
            .setLngLat([markerEvent.lng, markerEvent.lat])
            .addTo(map);

          el.addEventListener("click", () => setSelected(markerEvent));
          markerRefs.current.push(marker);
          bounds.extend([markerEvent.lng, markerEvent.lat]);
        });

        if (!bounds.isEmpty()) {
          map.fitBounds(bounds, { padding: 40, maxZoom: 12 });
        }
      } catch {
        if (!isCancelled) {
          setIsMapboxUnavailable(true);
        }
      }
    })();

    return () => {
      isCancelled = true;
      markerRefs.current.forEach((marker) => marker.remove());
      markerRefs.current = [];
      const map = mapRef.current as { remove?: () => void } | null;
      map?.remove?.();
      mapRef.current = null;
    };
  }, [days, lat, lng, mapToken, markers, radiusKm]);

  if (!mapToken) {
    return (
      <div className="rounded border border-dashed p-4 text-sm text-gray-700">
        <p className="font-medium">Map token not configured.</p>
        <p className="mt-1">Set NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN to enable map rendering. List view is still available.</p>
      </div>
    );
  }

  if (isMapboxUnavailable) {
    return (
      <div className="rounded border border-dashed p-4 text-sm text-gray-700">
        <p className="font-medium">Map view unavailable (mapbox not installed). Use List view.</p>
      </div>
    );
  }

  if (markers.length === 0) {
    return <p className="text-sm text-gray-600">No mappable events found in this result set yet.</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
        <span className="inline-flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-blue-500" /> Event marker</span>
        <span>Showing up to {MAX_MAP_MARKERS} events.</span>
      </div>
      {omittedCount > 0 ? <p className="text-xs text-amber-700">{omittedCount} additional markers omitted. Reduce radius/days to see more.</p> : null}
      <div ref={mapContainerRef} className="h-[420px] w-full rounded border" aria-label="Nearby events map" />
      <div className="flex flex-wrap gap-2">
      <button
        className="rounded border px-3 py-1 text-sm"
        type="button"
        onClick={fitToResults}
      >
        Center on results
      </button>
      <button
        className="rounded border px-3 py-1 text-sm"
        type="button"
        onClick={async () => {
          const map = mapRef.current as { getCenter?: () => { lat: number; lng: number } } | null;
          if (!map?.getCenter) return;
          const center = map.getCenter();
          setIsSearchingArea(true);
          try {
            await onSearchArea({ lat: center.lat, lng: center.lng });
          } finally {
            setIsSearchingArea(false);
          }
        }}
        disabled={isSearchingArea}
      >
        {isSearchingArea ? "Searching area..." : "Search this area"}
      </button>
      </div>
      {selected ? (
        <>
          <div className="hidden md:block"><EventPreviewCard event={selected} /></div>
          <div className="fixed inset-x-0 bottom-16 z-20 border-t bg-card p-3 shadow-lg md:hidden">
            <EventPreviewCard event={selected} />
          </div>
        </>
      ) : <p className="text-xs text-gray-600">Select a marker to preview an event.</p>}
    </div>
  );
}
