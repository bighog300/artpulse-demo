"use client";

import { useEffect, useMemo, useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorCard } from "@/components/ui/error-card";
import { Input } from "@/components/ui/input";
import { enqueueToast } from "@/lib/toast";
import { FollowedEntityStrip } from "@/components/personal/followed-entity-strip";
import { FollowedEntitySkeleton } from "@/components/personal/followed-entity-skeleton";

type ManageItem = { id: string; name: string; slug: string; followersCount: number; upcomingEventsCount: number };
type ManageResponse = { artists: ManageItem[]; venues: ManageItem[] };
type Tab = "ALL" | "ARTISTS" | "VENUES";

export function FollowedEntitiesGrid() {
  const [data, setData] = useState<ManageResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("ALL");
  const [query, setQuery] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function load() {
    setIsLoading(true);
    const response = await fetch("/api/follows/manage", { cache: "no-store" });
    if (!response.ok) {
      setError("Unable to load followed entities right now.");
      setIsLoading(false);
      return;
    }
    const body = (await response.json()) as ManageResponse;
    setData(body);
    setError(null);
    setIsLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  const rows = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const artistRows = (data?.artists ?? []).map((item) => ({ ...item, targetType: "ARTIST" as const }));
    const venueRows = (data?.venues ?? []).map((item) => ({ ...item, targetType: "VENUE" as const }));
    const merged = tab === "ARTISTS" ? artistRows : tab === "VENUES" ? venueRows : [...artistRows, ...venueRows];
    return merged.filter((item) => !normalized || item.name.toLowerCase().includes(normalized));
  }, [data, query, tab]);

  async function unfollow(target: { targetType: "ARTIST" | "VENUE"; targetId: string }) {
    if (pendingId) return;
    setPendingId(target.targetId);
    const prev = data;
    setData((current) => current ? {
      artists: target.targetType === "ARTIST" ? current.artists.filter((item) => item.id !== target.targetId) : current.artists,
      venues: target.targetType === "VENUE" ? current.venues.filter((item) => item.id !== target.targetId) : current.venues,
    } : current);

    try {
      const response = await fetch("/api/follows/bulk-delete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ targets: [{ targetType: target.targetType, targetId: target.targetId }] }),
      });
      if (!response.ok) throw new Error("request_failed");
      enqueueToast({ title: "Unfollowed" });
    } catch {
      setData(prev);
      enqueueToast({ title: "Could not unfollow right now", variant: "error" });
    } finally {
      setPendingId(null);
    }
  }

  if (isLoading) return <div className="space-y-2">{Array.from({ length: 4 }).map((_, idx) => <FollowedEntitySkeleton key={idx} />)}</div>;
  if (error) return <ErrorCard message={error} onRetry={() => void load()} />;

  const hasAny = Boolean((data?.artists.length ?? 0) || (data?.venues.length ?? 0));
  if (!hasAny) {
    return <EmptyState title="No follows yet" description="Follow artists and venues to build a personalized hub." actions={[{ label: "Discover artists", href: "/artists", variant: "secondary" }, { label: "Discover venues", href: "/venues", variant: "secondary" }]} />;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Tabs value={tab} onValueChange={(value) => setTab(value as Tab)}>
          <TabsList>
            <TabsTrigger value="ALL">All</TabsTrigger>
            <TabsTrigger value="ARTISTS">Artists</TabsTrigger>
            <TabsTrigger value="VENUES">Venues</TabsTrigger>
          </TabsList>
        </Tabs>
        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search followed items" className="w-full sm:w-64" aria-label="Search followed items" />
      </div>

      {rows.length === 0 ? <p className="text-sm text-muted-foreground">No followed items match this filter.</p> : (
        <ul className="space-y-2">
          {rows.map((row) => (
            <FollowedEntityStrip
              key={`${row.targetType}:${row.id}`}
              id={row.id}
              name={row.name}
              slug={row.slug}
              targetType={row.targetType}
              upcomingEventsCount={row.upcomingEventsCount}
              onUnfollow={unfollow}
              isPending={pendingId === row.id}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
