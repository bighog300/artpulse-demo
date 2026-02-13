"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { LocationPreferencesForm } from "@/components/location/location-preferences-form";

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
    const data = (await response.json()) as { items: NearbyEvent[] };
    setItems(data.items);
  }, [canSearch, form.lat, form.lng, form.radiusKm]);

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
        <div className="mt-3">
          <button className="rounded border px-3 py-1 text-sm" type="button" onClick={() => void loadEvents()} disabled={!canSearch}>Find nearby events</button>
        </div>
      </div>

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
