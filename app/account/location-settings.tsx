"use client";

import { type FormEvent, useState } from "react";

export function LocationSettings({ initial }: { initial: { locationLabel: string; lat: string; lng: string; radiusKm: string } }) {
  const [form, setForm] = useState(initial);
  const [status, setStatus] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
    setStatus(response.ok ? "Saved." : "Unable to save.");
  }

  return (
    <section className="rounded border p-4">
      <h2 className="text-lg font-semibold">Location settings</h2>
      <form className="mt-3 grid gap-3 md:grid-cols-2" onSubmit={onSubmit}>
        <label className="text-sm">Label
          <input className="mt-1 w-full rounded border p-2" value={form.locationLabel} onChange={(e) => setForm((prev) => ({ ...prev, locationLabel: e.target.value }))} />
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
        <button className="w-fit rounded border px-3 py-1 text-sm" type="submit">Save location</button>
      </form>
      {status ? <p className="mt-2 text-sm text-gray-600">{status}</p> : null}
    </section>
  );
}
