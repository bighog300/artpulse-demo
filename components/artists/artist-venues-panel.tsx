"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { buildLoginRedirectUrl } from "@/lib/auth-redirect";
import { enqueueToast } from "@/lib/toast";

type VenueOption = { id: string; name: string; slug: string };
type Assoc = {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  role: string | null;
  message: string | null;
  venue: { id: string; name: string; slug: string; cover: string | null };
};

export function ArtistVenuesPanel({ initialVenues }: { initialVenues: VenueOption[] }) {
  const router = useRouter();
  const [venues] = useState(initialVenues);
  const [query, setQuery] = useState("");
  const [selectedVenueId, setSelectedVenueId] = useState("");
  const [role, setRole] = useState("represented_by");
  const [message, setMessage] = useState("");
  const [associations, setAssociations] = useState<{ pending: Assoc[]; approved: Assoc[]; rejected: Assoc[] } | null>(null);

  const filtered = useMemo(() => venues.filter((v) => v.name.toLowerCase().includes(query.toLowerCase())).slice(0, 8), [query, venues]);

  async function loadAssociations() {
    const res = await fetch("/api/my/artist/venues", { cache: "no-store" });
    if (res.status === 401) {
      window.location.href = buildLoginRedirectUrl("/my/artist");
      return;
    }
    if (!res.ok) return;
    setAssociations(await res.json());
  }

  async function requestAssociation() {
    if (!selectedVenueId) return;
    const res = await fetch("/api/my/artist/venues/request", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ venueId: selectedVenueId, role, message: message || undefined }),
    });
    if (res.status === 401) {
      window.location.href = buildLoginRedirectUrl("/my/artist");
      return;
    }
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      enqueueToast({ title: body.message ?? "Failed to request association", variant: "error" });
      return;
    }
    enqueueToast({ title: "Association requested", variant: "success" });
    setMessage("");
    await loadAssociations();
    router.refresh();
  }

  async function cancelAssociation(id: string) {
    const res = await fetch(`/api/my/artist/venues/${id}`, { method: "DELETE" });
    if (res.status === 401) {
      window.location.href = buildLoginRedirectUrl("/my/artist");
      return;
    }
    if (!res.ok) {
      enqueueToast({ title: "Failed to cancel request", variant: "error" });
      return;
    }
    enqueueToast({ title: "Request canceled", variant: "success" });
    await loadAssociations();
  }

  return (
    <section className="space-y-3 rounded border p-4">
      <h2 className="text-lg font-semibold">Venues</h2>
      <div className="space-y-2">
        <input className="w-full rounded border px-2 py-1" placeholder="Search venues" value={query} onChange={(e) => setQuery(e.target.value)} />
        <select className="w-full rounded border px-2 py-1" value={selectedVenueId} onChange={(e) => setSelectedVenueId(e.target.value)}>
          <option value="">Select a venue</option>
          {filtered.map((venue) => <option key={venue.id} value={venue.id}>{venue.name}</option>)}
        </select>
        <select className="w-full rounded border px-2 py-1" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="represented_by">Represented by</option>
          <option value="exhibited_at">Exhibited at</option>
          <option value="resident">Resident</option>
          <option value="collaborator">Collaborator</option>
        </select>
        <textarea className="w-full rounded border px-2 py-1" rows={3} placeholder="Optional note" value={message} onChange={(e) => setMessage(e.target.value)} />
        <div className="flex gap-2">
          <button className="rounded border px-3 py-1" onClick={requestAssociation}>Request association</button>
          <button className="rounded border px-3 py-1" onClick={loadAssociations}>Refresh list</button>
        </div>
      </div>

      {associations ? (
        <div className="space-y-3">
          {["pending", "approved", "rejected"].map((group) => (
            <div key={group}>
              <h3 className="text-sm font-semibold uppercase">{group}</h3>
              <ul className="space-y-2">
                {(associations[group as keyof typeof associations] as Assoc[]).map((item) => (
                  <li key={item.id} className="rounded border p-2 text-sm">
                    <div className="font-medium">{item.venue.name}</div>
                    <div className="text-zinc-600">Role: {item.role ?? "n/a"}</div>
                    {item.message ? <div className="text-zinc-600">{item.message}</div> : null}
                    {item.status === "PENDING" ? <button className="mt-1 rounded border px-2 py-1" onClick={() => cancelAssociation(item.id)}>Cancel</button> : null}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : <p className="text-sm text-zinc-600">Load your association requests to manage status.</p>}
    </section>
  );
}
