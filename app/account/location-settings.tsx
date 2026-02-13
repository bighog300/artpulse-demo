"use client";

import { LocationPreferencesForm } from "@/components/location/location-preferences-form";

export function LocationSettings({ initial }: { initial: { locationLabel: string; lat: string; lng: string; radiusKm: string } }) {
  return (
    <section className="rounded border p-4">
      <h2 className="text-lg font-semibold">Location settings</h2>
      <div className="mt-3">
        <LocationPreferencesForm
          initial={initial}
          saveButtonLabel="Save location"
          onSave={async (payload) => {
            const response = await fetch("/api/me/location", {
              method: "PUT",
              headers: { "content-type": "application/json" },
              body: JSON.stringify(payload),
            });
            return response.ok;
          }}
        />
      </div>
    </section>
  );
}
