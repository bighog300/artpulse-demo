"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LocationPreferencesForm } from "@/components/location/location-preferences-form";
import { NearbyMap } from "@/components/nearby/nearby-map";
import { resolveNearbyView, type NearbyEventItem, type NearbyView } from "@/lib/nearby-map";

type LocationDraft = {
  locationLabel: string;
  lat: string;
  lng: string;
  radiusKm: string;
};

const DAYS_FILTER = 30;
const VIEW_STORAGE_KEY = "nearby:view";

export function NearbyClient({ initialLocation, isAuthenticated, initialView }: { initialLocation: LocationDraft; isAuthenticated: boolean; initialView: NearbyView }) {
  const [form, setForm] = useState<LocationDraft>(initialLocation);
  const [items, setItems] = useState<NearbyEventItem[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [view, setView] = useState<NearbyView>(initialView);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const canSearch = useMemo(() => form.lat.trim() !== "" && form.lng.trim() !== "", [form.lat, form.lng]);

  const updateView = useCallback((nextView: NearbyView) => {
    setView(nextView);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(VIEW_STORAGE_KEY, nextView);
    }
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.set("view", nextView);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [pathname, router, searchParams]);

  useEffect(() => {
    const queryView = resolveNearbyView(searchParams?.get("view") ?? null);
    if (queryView !== view) setView(queryView);
  }, [searchParams, view]);

  useEffect(() => {
    if (searchParams?.get("view")) return;
    if (typeof window === "undefined") return;
    const stored = resolveNearbyView(window.localStorage.getItem(VIEW_STORAGE_KEY));
    if (stored !== view) {
      updateView(stored);
    }
  }, [searchParams, updateView, view]);

  const loadEvents = useCallback(async (override?: { lat: string; lng: string }) => {
    const targetLat = override?.lat ?? form.lat;
    const targetLng = override?.lng ?? form.lng;
    if (targetLat.trim() === "" || targetLng.trim() === "") return;

    setMessage(null);
    const query = new URLSearchParams({
      lat: targetLat,
      lng: targetLng,
      radiusKm: form.radiusKm || "25",
      days: String(DAYS_FILTER),
      limit: "300",
    });
    const response = await fetch(`/api/events/nearby?${query.toString()}`, { cache: "no-store" });
    if (!response.ok) {
      setMessage("Unable to load nearby events.");
      setItems([]);
      return;
    }
    const data = (await response.json()) as { items: NearbyEventItem[] };
    setItems(data.items);
  }, [form.lat, form.lng, form.radiusKm]);

  useEffect(() => {
    if (canSearch) void loadEvents();
  }, [canSearch, loadEvents]);

  return (
    <div className="space-y-4">
      <div className="rounded border p-4">
        <LocationPreferencesForm
          initial={initialLocation}
          saveButtonLabel={isAuthenticated ? "Save location" : "Use this location"}
          onSave={async (payload) => {
            setForm({
              locationLabel: payload.locationLabel ?? "",
              lat: payload.lat == null ? "" : String(payload.lat),
              lng: payload.lng == null ? "" : String(payload.lng),
              radiusKm: String(payload.radiusKm),
            });
            if (!isAuthenticated) return true;
            const response = await fetch("/api/me/location", {
              method: "PUT",
              headers: { "content-type": "application/json" },
              body: JSON.stringify(payload),
            });
            return response.ok;
          }}
          afterSave={(next) => setForm(next)}
        />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button className="rounded border px-3 py-1 text-sm" type="button" onClick={() => void loadEvents()} disabled={!canSearch}>Find nearby events</button>
          <div className="inline-flex rounded border p-1 text-sm" role="tablist" aria-label="Nearby view mode">
            <button className={`rounded px-3 py-1 ${view === "list" ? "bg-gray-900 text-white" : ""}`} onClick={() => updateView("list")} type="button" role="tab" aria-selected={view === "list"}>List</button>
            <button className={`rounded px-3 py-1 ${view === "map" ? "bg-gray-900 text-white" : ""}`} onClick={() => updateView("map")} type="button" role="tab" aria-selected={view === "map"}>Map</button>
          </div>
        </div>
      </div>

      {message ? <p className="text-sm text-gray-600">{message}</p> : null}

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Upcoming nearby events</h2>
        {view === "map" ? (
          <NearbyMap
            events={items}
            lat={form.lat}
            lng={form.lng}
            radiusKm={form.radiusKm}
            days={DAYS_FILTER}
            onSearchArea={async (center) => {
              const nextLat = String(center.lat);
              const nextLng = String(center.lng);
              setForm((prev) => ({ ...prev, lat: nextLat, lng: nextLng }));
              await loadEvents({ lat: nextLat, lng: nextLng });
            }}
          />
        ) : null}
        {view === "list" ? (
          items.length === 0 ? <p className="text-sm text-gray-600">No events found for this area yet.</p> : (
            <ul className="space-y-2">
              {items.map((item) => (
                <li key={item.id} className="rounded border p-3">
                  <Link className="font-medium underline" href={`/events/${item.slug}`}>{item.title}</Link>
                  <p className="text-sm text-gray-600">
                    {new Date(item.startAt).toLocaleString()} {item.venueName ? <>{" · "}{item.venueName}</> : null}
                  </p>
                </li>
              ))}
            </ul>
          )
        ) : null}
      </section>
    </div>
  );
}
