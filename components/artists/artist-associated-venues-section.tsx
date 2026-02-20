"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { AssociatedVenue } from "@/lib/artist-associated-venues";

type FilterKey = "all" | "exhibitions" | string;

function Badge({ text, subtle = false }: { text: string; subtle?: boolean }) {
  return <span className={`rounded-full px-2 py-0.5 text-xs ${subtle ? "bg-muted text-muted-foreground" : "bg-secondary text-secondary-foreground"}`}>{text}</span>;
}

export function ArtistAssociatedVenuesSection({ verified, derived }: { verified: AssociatedVenue[]; derived: AssociatedVenue[] }) {
  const [filter, setFilter] = useState<FilterKey>("all");

  const roleOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of verified) map.set(item.roleKey, item.roleLabel);
    return Array.from(map.entries());
  }, [verified]);

  const filtered = useMemo(() => {
    if (filter === "all") return { verified, derived };
    if (filter === "exhibitions") return { verified: [], derived };
    return { verified: verified.filter((item) => item.roleKey === filter), derived: [] };
  }, [filter, verified, derived]);

  return (
    <section className="space-y-3">
      <h2 className="text-2xl font-semibold">Associated venues</h2>
      <div className="flex flex-wrap gap-2">
        <button className="rounded border px-2 py-1 text-sm" onClick={() => setFilter("all")}>All</button>
        {roleOptions.map(([key, label]) => <button key={key} className="rounded border px-2 py-1 text-sm" onClick={() => setFilter(key)}>{label}</button>)}
        {derived.length > 0 ? <button className="rounded border px-2 py-1 text-sm" onClick={() => setFilter("exhibitions")}>Exhibitions</button> : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <h3 className="text-lg font-medium">Verified</h3>
          {filtered.verified.length === 0 ? <p className="text-sm text-muted-foreground">No verified venues yet.</p> : (
            <ul className="space-y-2">
              {filtered.verified.map((venue) => <li key={`v-${venue.id}`} className="flex items-center gap-2"><Link className="underline" href={`/venues/${venue.slug}`}>{venue.name}</Link><Badge text={venue.roleLabel} /></li>)}
            </ul>
          )}
        </div>
        <div>
          <h3 className="text-lg font-medium">From exhibitions</h3>
          {filtered.derived.length === 0 ? <p className="text-sm text-muted-foreground">No exhibition venues yet.</p> : (
            <ul className="space-y-2">
              {filtered.derived.map((venue) => <li key={`d-${venue.id}`} className="flex items-center gap-2"><Link className="underline" href={`/venues/${venue.slug}`}>{venue.name}</Link><Badge text="Exhibition venue" subtle /></li>)}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
