"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type LocationDraft = {
  locationLabel: string;
  lat: string;
  lng: string;
  radiusKm: string;
};

type NearbyEvent = {
  id: string;
  slug: string;
  title: string;
  startAt: string;
  venue: { name: string; slug: string } | null;
};

export function NearbyClient({ initialLocation, isAuthenticated }: { initialLocation: LocationDraft; isAuthenticated: boolean }) {
  const [form, setForm] = useState<LocationDraft>(initialLocation);
  const [items, setItems] = useState<NearbyEvent[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  const canSearch = useMemo(() => form.lat.trim() !== "" && form.lng.trim() !== "", [form.lat, form.lng]);

  const loadEvents = useCallback(async () => {
    if (!canSearch) return;
    setMessage(null);
    const query = new URLSearchParams({
      lat: form.lat,
      lng: form.lng,
      radiusKm: form.radiusKm || "25",
      days: "30",
      limit: "20",
    });
    const response = await fetch(`/api/events/nearby?${query.toString()}`, { cache: "no-store" });
    if (!response.ok) {
      setMessage("Unable to load nearby events.");
      setItems([]);
      return;
    }
    const data = await response.json() as { items: NearbyEvent[] };
    setItems(data.items);
  }, [canSearch, form.lat, form.lng, form.radiusKm]);

  useEffect(() => {
    if (canSearch) {
      void loadEvents();
    }
  }, [canSearch, loadEvents]);

  async function saveLocation() {
    if (!isAuthenticated) return;
    const response = await fetch("/api/me/location", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        locationLabel: form.locationLabel || null,
        lat: form.lat === "" ? null : Number(form.lat),
        lng: form.lng === "" ? null : Number(form.lng),
        radiusKm: Number(form.radiusKm || "25"),
      }),
    });
    setMessage(response.ok ? "Location saved." : "Unable to save location.");
  }

  return (
    <div className="space-y-4">
      <form
        className="grid gap-3 rounded border p-4 md:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          void loadEvents();
        }}
      >
        <label className="text-sm">Location label
          <input className="mt-1 w-full rounded border p-2" value={form.locationLabel} onChange={(e) => setForm((prev) => ({ ...prev, locationLabel: e.target.value }))} placeholder="Bristol" />
        </label>
        <label className="text-sm">Radius (km)
          <input className="mt-1 w-full rounded border p-2" type="number" min={1} max={200} value={form.radiusKm} onChange={(e) => setForm((prev) => ({ ...prev, radiusKm: e.target.value }))} />
        </label>
        <label className="text-sm">Latitude
          <input className="mt-1 w-full rounded border p-2" type="number" step="any" value={form.lat} onChange={(e) => setForm((prev) => ({ ...prev, lat: e.target.value }))} />
        </label>
        <label className="text-sm">Longitude
          <input className="mt-1 w-full rounded border p-2" type="number" step="any" value={form.lng} onChange={(e) => setForm((prev) => ({ ...prev, lng: e.target.value }))} />
        </label>
        <div className="flex gap-2 md:col-span-2">
          <button className="rounded border px-3 py-1 text-sm" type="submit">Find nearby events</button>
          {isAuthenticated ? <button className="rounded border px-3 py-1 text-sm" type="button" onClick={() => void saveLocation()}>Save location</button> : null}
        </div>
      </form>

      {message ? <p className="text-sm text-gray-600">{message}</p> : null}

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Upcoming nearby events</h2>
        {items.length === 0 ? <p className="text-sm text-gray-600">No events found for this area yet.</p> : (
          <ul className="space-y-2">
            {items.map((item) => (
              <li key={item.id} className="rounded border p-3">
                <Link className="font-medium underline" href={`/events/${item.slug}`}>{item.title}</Link>
                <p className="text-sm text-gray-600">
                  {new Date(item.startAt).toLocaleString()} {item.venue ? <>· <Link className="underline" href={`/venues/${item.venue.slug}`}>{item.venue.name}</Link></> : null}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
