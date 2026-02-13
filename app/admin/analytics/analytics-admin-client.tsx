"use client";

import { useEffect, useState } from "react";

type WindowDays = 7 | 30;

type OverviewPayload = {
  windowDays: number;
  totals: {
    eventsTracked: number;
    uniqueUsers: number;
    uniqueSessions: number;
    digestsViewed: number;
    digestClicks: number;
    nearbyClicks: number;
    searchClicks: number;
    followingClicks: number;
    follows: number;
    saveSearches: number;
  };
  ctr: {
    digestCtr: number | null;
    nearbyCtr: number | null;
    searchCtr: number | null;
  };
  top: {
    events: Array<{ eventId: string; clicks: number }>;
    venues: Array<{ venueId: string; clicks: number }>;
    artists: Array<{ artistId: string; clicks: number }>;
  };
};

function formatPercent(value: number | null) {
  if (value == null) return "—";
  return `${(value * 100).toFixed(1)}%`;
}

function TopList({ title, rows }: { title: string; rows: Array<{ id: string; clicks: number }> }) {
  return (
    <section className="border rounded p-3">
      <h3 className="font-medium">{title}</h3>
      {rows.length ? (
        <ul className="mt-2 space-y-1 text-sm">
          {rows.map((row) => (
            <li key={row.id} className="flex justify-between gap-4">
              <code className="break-all">{row.id}</code>
              <span>{row.clicks}</span>
            </li>
          ))}
        </ul>
      ) : <p className="mt-2 text-sm text-neutral-500">No data in this window.</p>}
    </section>
  );
}

export default function AnalyticsAdminClient() {
  const [days, setDays] = useState<WindowDays>(7);
  const [data, setData] = useState<OverviewPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setError(null);
      const res = await fetch(`/api/admin/analytics/overview?days=${days}`, { cache: "no-store" });
      const body = await res.json();
      if (cancelled) return;
      if (!res.ok) {
        setData(null);
        setError(body?.error?.message || "Failed to load analytics");
        return;
      }
      setData(body as OverviewPayload);
    }
    void load();
    return () => { cancelled = true; };
  }, [days]);

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <label htmlFor="analytics-window" className="text-sm font-medium">Window</label>
        <select
          id="analytics-window"
          className="border rounded px-2 py-1"
          value={String(days)}
          onChange={(e) => setDays(Number(e.target.value) as WindowDays)}
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
        </select>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {!data ? <p className="text-sm text-neutral-500">Loading analytics…</p> : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(data.totals).map(([key, value]) => (
              <div key={key} className="border rounded p-3">
                <p className="text-xs uppercase tracking-wide text-neutral-500">{key}</p>
                <p className="text-xl font-semibold">{value}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="border rounded p-3"><p className="text-xs uppercase text-neutral-500">Digest CTR</p><p className="text-xl font-semibold">{formatPercent(data.ctr.digestCtr)}</p></div>
            <div className="border rounded p-3"><p className="text-xs uppercase text-neutral-500">Nearby CTR</p><p className="text-xl font-semibold">{formatPercent(data.ctr.nearbyCtr)}</p></div>
            <div className="border rounded p-3"><p className="text-xs uppercase text-neutral-500">Search CTR</p><p className="text-xl font-semibold">{formatPercent(data.ctr.searchCtr)}</p></div>
          </div>

          <div className="grid gap-3 lg:grid-cols-3">
            <TopList title="Top Events" rows={data.top.events.map((item) => ({ id: item.eventId, clicks: item.clicks }))} />
            <TopList title="Top Venues" rows={data.top.venues.map((item) => ({ id: item.venueId, clicks: item.clicks }))} />
            <TopList title="Top Artists" rows={data.top.artists.map((item) => ({ id: item.artistId, clicks: item.clicks }))} />
          </div>
        </>
      )}
    </section>
  );
}
