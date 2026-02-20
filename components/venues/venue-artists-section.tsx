"use client";

import { useMemo, useState } from "react";
import type { ArtistSummary } from "@/lib/venue-associated-artists";
import { VenueArtistCard } from "@/components/venues/venue-artist-card";

type FilterKey = "all" | "exhibitions" | string;

export function VenueArtistsSection({ verifiedArtists, derivedArtists }: { verifiedArtists: ArtistSummary[]; derivedArtists: ArtistSummary[] }) {
  const [filter, setFilter] = useState<FilterKey>("all");

  const roleOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of verifiedArtists) map.set(item.roleKey, item.roleLabel);
    return Array.from(map.entries());
  }, [verifiedArtists]);

  const filtered = useMemo(() => {
    if (filter === "all") return { verifiedArtists, derivedArtists };
    if (filter === "exhibitions") return { verifiedArtists: [], derivedArtists };
    return { verifiedArtists: verifiedArtists.filter((item) => item.roleKey === filter), derivedArtists: [] };
  }, [filter, verifiedArtists, derivedArtists]);

  if (verifiedArtists.length === 0 && derivedArtists.length === 0) {
    return (
      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">Artists</h2>
        <p className="rounded border border-dashed p-4 text-sm text-muted-foreground">No associated artists yet.</p>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">Artists</h2>
      <div className="flex flex-wrap gap-2">
        <button className="rounded border px-2 py-1 text-sm" onClick={() => setFilter("all")}>All</button>
        {roleOptions.map(([key, label]) => <button key={key} className="rounded border px-2 py-1 text-sm" onClick={() => setFilter(key)}>{label}</button>)}
        {derivedArtists.length > 0 ? <button className="rounded border px-2 py-1 text-sm" onClick={() => setFilter("exhibitions")}>From exhibitions</button> : null}
      </div>

      {filtered.verifiedArtists.length > 0 ? (
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Verified</h3>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.verifiedArtists.map((artist) => (
              <li key={`verified-${artist.id}`}>
                <VenueArtistCard artist={artist} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {filtered.derivedArtists.length > 0 ? (
        <details className="rounded border p-4" open>
          <summary className="cursor-pointer text-lg font-medium">From exhibitions ({filtered.derivedArtists.length})</summary>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.derivedArtists.map((artist) => (
              <li key={`derived-${artist.id}`}>
                <VenueArtistCard artist={artist} />
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </section>
  );
}
