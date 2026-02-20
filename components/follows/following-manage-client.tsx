"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorCard } from "@/components/ui/error-card";
import { LoadingCard } from "@/components/ui/loading-card";
import { enqueueToast } from "@/lib/toast";
import { track } from "@/lib/analytics/client";

type ManageItem = { id: string; name: string; slug: string; followersCount: number; upcomingEventsCount: number };
type ManageResponse = { artists: ManageItem[]; venues: ManageItem[] };

type Tab = "ALL" | "ARTISTS" | "VENUES";

type Selection = { targetType: "ARTIST" | "VENUE"; targetId: string };

export function FollowingManageClient() {
  const [data, setData] = useState<ManageResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<Tab>("ALL");
  const [selected, setSelected] = useState<Record<string, Selection>>({});
  const [isSaving, setIsSaving] = useState(false);

  const load = async () => {
    setIsLoading(true);
    const response = await fetch("/api/follows/manage", { cache: "no-store" });
    if (!response.ok) {
      setError("Unable to load follows right now.");
      setData(null);
      setIsLoading(false);
      return;
    }
    const body = (await response.json()) as ManageResponse;
    setData(body);
    setError(null);
    setIsLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const rows = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const artistRows = (data?.artists ?? []).map((item) => ({ ...item, targetType: "ARTIST" as const }));
    const venueRows = (data?.venues ?? []).map((item) => ({ ...item, targetType: "VENUE" as const }));
    const merged = tab === "ARTISTS" ? artistRows : tab === "VENUES" ? venueRows : [...artistRows, ...venueRows];
    return merged.filter((item) => !normalized || item.name.toLowerCase().includes(normalized));
  }, [data, query, tab]);

  const selectedTargets = Object.values(selected);
  const hasAny = Boolean((data?.artists.length ?? 0) || (data?.venues.length ?? 0));

  const toggle = (row: { targetType: "ARTIST" | "VENUE"; id: string }) => {
    const key = `${row.targetType}:${row.id}`;
    setSelected((current) => {
      const next = { ...current };
      if (next[key]) delete next[key];
      else next[key] = { targetType: row.targetType, targetId: row.id };
      return next;
    });
  };

  const unfollowSelected = async () => {
    if (!selectedTargets.length || isSaving) return;
    if (!window.confirm(`Unfollow ${selectedTargets.length} selected item(s)?`)) return;
    setIsSaving(true);

    const prev = data;
    const keys = new Set(selectedTargets.map((target) => `${target.targetType}:${target.targetId}`));
    setData((current) => current ? {
      artists: current.artists.filter((item) => !keys.has(`ARTIST:${item.id}`)),
      venues: current.venues.filter((item) => !keys.has(`VENUE:${item.id}`)),
    } : current);
    setSelected({});

    try {
      const response = await fetch("/api/follows/bulk-delete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ targets: selectedTargets }),
      });
      if (!response.ok) throw new Error("request_failed");
      selectedTargets.forEach((target) => track("entity_unfollowed", {
        type: target.targetType === "ARTIST" ? "artist" : "venue",
        slug: rows.find((row) => row.id === target.targetId && row.targetType === target.targetType)?.slug,
        mode: "bulk",
      }));
      enqueueToast({ title: "Selected follows removed" });
    } catch {
      setData(prev);
      enqueueToast({ title: "Unable to unfollow selected items", variant: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="space-y-2"><LoadingCard lines={2} /><LoadingCard lines={2} /></div>;
  if (error) return <ErrorCard message={error} onRetry={() => void load()} />;

  if (!hasAny) {
    return (
      <EmptyState
        title="No follows yet"
        description="Follow artists and venues to personalize your feed."
        actions={[
          { label: "Browse venues", href: "/venues", variant: "secondary" },
          { label: "Browse artists", href: "/artists", variant: "secondary" },
          { label: "Go to Following", href: "/following", variant: "secondary" },
        ]}
      />
    );
  }

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search follows"
          className="rounded border px-3 py-1.5 text-sm"
        />
        {(["ALL", "ARTISTS", "VENUES"] as const).map((item) => (
          <button key={item} type="button" className={`rounded border px-3 py-1 text-sm ${tab === item ? "border-primary" : "border-border"}`} onClick={() => setTab(item)}>{item === "ALL" ? "All" : item === "ARTISTS" ? "Artists" : "Venues"}</button>
        ))}
        <button type="button" className="rounded border px-3 py-1 text-sm" disabled={!selectedTargets.length || isSaving} onClick={unfollowSelected}>{isSaving ? "Removing..." : "Unfollow selected"}</button>
      </div>

      {rows.length === 0 ? <p className="text-sm text-muted-foreground">No matches</p> : (
        <ul className="space-y-2">
          {rows.map((row) => {
            const key = `${row.targetType}:${row.id}`;
            const href = row.targetType === "ARTIST" ? `/artists/${row.slug}` : `/venues/${row.slug}`;
            return (
              <li key={key} className="flex items-center justify-between gap-2 rounded border p-3">
                <label className="flex items-center gap-3">
                  <input type="checkbox" checked={Boolean(selected[key])} onChange={() => toggle(row)} />
                  <div>
                    <Link className="font-medium underline" href={href}>{row.name}</Link>
                    <p className="text-xs text-muted-foreground">Upcoming 30d: {row.upcomingEventsCount} · Followers: {row.followersCount}</p>
                  </div>
                </label>
                <span className="text-xs text-muted-foreground">{row.targetType === "ARTIST" ? "Artist" : "Venue"}</span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
