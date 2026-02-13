"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LocationPreferencesForm } from "@/components/location/location-preferences-form";
import { NearbyMap } from "@/components/nearby/nearby-map";
import { LoadingCard } from "@/components/ui/loading-card";
import { ErrorCard } from "@/components/ui/error-card";
import { resolveNearbyView, type NearbyEventItem, type NearbyView } from "@/lib/nearby-map";
import { SaveSearchButton } from "@/components/saved-searches/save-search-button";
import { trackEngagement } from "@/lib/engagement-client";
import { EventCard } from "@/components/events/event-card";

type LocationDraft = { locationLabel: string; lat: string; lng: string; radiusKm: string };

const DAYS_FILTER = 30;
const VIEW_STORAGE_KEY = "nearby:view";
const FILTER_STORAGE_KEY = "nearby:filters";

export function NearbyClient({ initialLocation, isAuthenticated, initialView }: { initialLocation: LocationDraft; isAuthenticated: boolean; initialView: NearbyView }) {
  const [form, setForm] = useState<LocationDraft>(initialLocation);
  const [items, setItems] = useState<NearbyEventItem[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState<NearbyView>(initialView);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const viewedImpressionKeys = useRef<Set<string>>(new Set());
  const canSearch = useMemo(() => form.lat.trim() !== "" && form.lng.trim() !== "", [form.lat, form.lng]);

  const updateView = useCallback((nextView: NearbyView) => {
    setView(nextView);
    if (typeof window !== "undefined") window.localStorage.setItem(VIEW_STORAGE_KEY, nextView);
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
    if (stored !== view) updateView(stored);
  }, [searchParams, updateView, view]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(FILTER_STORAGE_KEY);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved) as { radiusKm?: string };
      if (parsed.radiusKm) setForm((prev) => ({ ...prev, radiusKm: parsed.radiusKm ?? prev.radiusKm }));
    } catch {}
  }, []);

  const loadEvents = useCallback(async (override?: { lat: string; lng: string }) => {
    const targetLat = override?.lat ?? form.lat;
    const targetLng = override?.lng ?? form.lng;
    if (targetLat.trim() === "" || targetLng.trim() === "") return;
    setMessage(null);
    setIsLoading(true);
    const query = new URLSearchParams({ lat: targetLat, lng: targetLng, radiusKm: form.radiusKm || "25", days: String(DAYS_FILTER), limit: "300" });
    try {
      const response = await fetch(`/api/events/nearby?${query.toString()}`, { cache: "no-store" });
      if (!response.ok) { setMessage("Unable to load nearby events."); setItems([]); return; }
      const data = (await response.json()) as { items: NearbyEventItem[] };
      setItems(data.items);
      if (typeof window !== "undefined") window.localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify({ radiusKm: form.radiusKm || "25" }));
    } catch { setMessage("Unable to load nearby events."); setItems([]); } finally { setIsLoading(false); }
  }, [form.lat, form.lng, form.radiusKm]);

  useEffect(() => { if (canSearch) void loadEvents(); }, [canSearch, loadEvents]);

  useEffect(() => {
    const visible = items.slice(0, 10);
    for (const [index, item] of visible.entries()) {
      const key = `${item.id}:${index}`;
      if (viewedImpressionKeys.current.has(key)) continue;
      viewedImpressionKeys.current.add(key);
      trackEngagement({ surface: "NEARBY", action: "VIEW", targetType: "EVENT", targetId: item.id, meta: { position: index } });
    }
  }, [items]);

  return (
    <div className="space-y-4">
      <div className="rounded border p-4">
        <LocationPreferencesForm
          initial={initialLocation}
          saveButtonLabel={isAuthenticated ? "Save location" : "Use this location"}
          onSave={async (payload) => {
            setForm({ locationLabel: payload.locationLabel ?? "", lat: payload.lat == null ? "" : String(payload.lat), lng: payload.lng == null ? "" : String(payload.lng), radiusKm: String(payload.radiusKm) });
            if (!isAuthenticated) return true;
            const response = await fetch("/api/me/location", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
            return response.ok;
          }}
          afterSave={(next) => setForm(next)}
        />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button className="rounded border px-3 py-1 text-sm" type="button" onClick={() => void loadEvents()} disabled={!canSearch}>Find nearby events</button>
          {isAuthenticated && canSearch ? <SaveSearchButton type="NEARBY" params={{ lat: Number(form.lat), lng: Number(form.lng), radiusKm: Number(form.radiusKm || "25"), days: DAYS_FILTER, tags: [] }} /> : null}
          <div className="inline-flex rounded border p-1 text-sm" role="tablist" aria-label="Nearby view mode">
            <button className={`rounded px-3 py-1 ${view === "list" ? "bg-gray-900 text-white" : ""}`} onClick={() => updateView("list")} type="button" role="tab" aria-selected={view === "list"}>List</button>
            <button className={`rounded px-3 py-1 ${view === "map" ? "bg-gray-900 text-white" : ""}`} onClick={() => updateView("map")} type="button" role="tab" aria-selected={view === "map"}>Map</button>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-zinc-100 px-2 py-1">days: {DAYS_FILTER}</span>
          <span className="rounded-full bg-zinc-100 px-2 py-1">radius: {form.radiusKm || "25"}km</span>
          {form.locationLabel ? <span className="rounded-full bg-zinc-100 px-2 py-1">location: {form.locationLabel}</span> : null}
        </div>
      </div>

      {message ? <ErrorCard message={message} onRetry={() => void loadEvents()} /> : null}

      <section className="space-y-2" aria-busy={isLoading}>
        <h2 className="text-lg font-semibold">Upcoming nearby events</h2>
        {isLoading ? (<div className="space-y-2"><LoadingCard lines={2} /><LoadingCard lines={2} /></div>) : null}
        {view === "map" && !isLoading ? <NearbyMap events={items} lat={form.lat} lng={form.lng} radiusKm={form.radiusKm} days={DAYS_FILTER} onSearchArea={async (center) => { const nextLat = String(center.lat); const nextLng = String(center.lng); setForm((prev) => ({ ...prev, lat: nextLat, lng: nextLng })); await loadEvents({ lat: nextLat, lng: nextLng }); }} /> : null}
        {view === "list" && !isLoading ? (items.length === 0 ? <p className="text-sm text-gray-600">No events found for this area yet.</p> : <ul className="space-y-2">{items.map((item, idx) => (<li key={item.id} onClick={() => trackEngagement({ surface: "NEARBY", action: "CLICK", targetType: "EVENT", targetId: item.id, meta: { position: idx } })}><EventCard href={`/events/${item.slug}`} title={item.title} startAt={item.startAt} venueName={item.venueName} /></li>))}</ul>) : null}
      </section>
    </div>
  );
}
