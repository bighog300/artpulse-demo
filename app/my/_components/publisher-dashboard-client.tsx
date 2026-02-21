"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

type DashboardPayload = {
  needsOnboarding?: boolean;
  message?: string;
  nextHref?: string;
  artist?: { id: string; name: string; slug: string; avatarUrl?: string | null };
  stats?: {
    artworks: { total: number; published: number; drafts: number };
    views: { last30: number; last7: number; last90: number; prior30?: number };
    upcomingEvents: { next30Count: number; nextEvent?: { id: string; slug: string; title: string; startAt: string } };
    profile: { completenessPct: number; missing: string[] };
  };
  todo?: Array<{ id: string; label: string; count: number; href: string }>;
  drafts?: { artworks: Array<{ id: string; title: string; slug?: string | null; coverUrl?: string | null }> };
  topArtworks?: Array<{ id: string; title: string; slug?: string | null; coverUrl?: string | null; views30: number }>;
  recent?: Array<{ label: string; href: string; occurredAtISO: string }>;
  entities?: { venues?: Array<{ id: string; name: string; slug: string; isPublished: boolean }> };
};

export function PublisherDashboardClient() {
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/my/dashboard", { cache: "no-store" });
      if (!res.ok) throw new Error(`request_failed_${res.status}`);
      const json = await res.json() as DashboardPayload;
      setData(json);
    } catch {
      setError("Could not load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <div className="space-y-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}</div>;
  }

  if (error) {
    return <Card><CardContent className="space-y-3 p-6"><p>{error}</p><Button onClick={() => void load()}>Retry</Button></CardContent></Card>;
  }

  if (data?.needsOnboarding) {
    return (
      <Card>
        <CardHeader><CardTitle>Welcome to Publisher Dashboard</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">{data.message}</p>
          <Button asChild><Link href={data.nextHref || "/my/artist"}>Set up artist profile</Link></Button>
        </CardContent>
      </Card>
    );
  }

  const viewDelta = (data?.stats?.views.last30 ?? 0) - (data?.stats?.views.prior30 ?? 0);

  return (
    <div className="space-y-6">
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardHeader><CardTitle className="text-base">Artworks</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold">{data?.stats?.artworks.total ?? 0}</p><p className="text-xs text-muted-foreground">{data?.stats?.artworks.published ?? 0} published · {data?.stats?.artworks.drafts ?? 0} drafts</p><Link className="text-sm underline" href="/my/artwork">Manage artworks</Link></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Views (30d)</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold">{data?.stats?.views.last30 ?? 0}</p><p className="text-xs text-muted-foreground">{viewDelta >= 0 ? "+" : ""}{viewDelta} vs prior 30d</p><Link className="text-sm underline" href="/my/analytics">View analytics</Link></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Upcoming events</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold">{data?.stats?.upcomingEvents.next30Count ?? 0}</p><p className="text-xs text-muted-foreground">{data?.stats?.upcomingEvents.nextEvent ? `${data.stats.upcomingEvents.nextEvent.title} · ${new Date(data.stats.upcomingEvents.nextEvent.startAt).toLocaleDateString()}` : "No upcoming events"}</p><Link className="text-sm underline" href="/my/events">Manage events</Link></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Profile completeness</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold">{data?.stats?.profile.completenessPct ?? 0}%</p><p className="text-xs text-muted-foreground">Missing: {(data?.stats?.profile.missing ?? []).join(", ") || "None"}</p><Link className="text-sm underline" href="/my/artist">Edit profile</Link></CardContent></Card>
      </section>

      <section>
        <Card>
          <CardHeader><CardTitle>To do</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2">{(data?.todo ?? []).map((item) => <li key={item.id} className="flex items-center justify-between gap-3"><span className="text-sm">{item.label}</span><span className="flex items-center gap-2"><Badge variant="secondary">{item.count}</Badge><Link href={item.href} className="text-sm underline">Fix</Link></span></li>)}</ul>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-3 lg:grid-cols-2">
        <Card><CardHeader><CardTitle>Recent activity</CardTitle></CardHeader><CardContent><ul className="space-y-2">{(data?.recent ?? []).map((item) => <li key={`${item.label}-${item.occurredAtISO}`}><Link href={item.href} className="text-sm underline">{item.label}</Link></li>)}</ul></CardContent></Card>
        <Card><CardHeader><CardTitle>Drafts + Top artworks</CardTitle></CardHeader><CardContent className="space-y-4"><div><p className="mb-1 text-sm font-medium">Drafts</p><ul className="space-y-1">{(data?.drafts?.artworks ?? []).map((item) => <li key={item.id} className="text-sm"><Link className="underline" href={`/my/artwork/${item.id}`}>{item.title}</Link></li>)}</ul></div><div><p className="mb-1 text-sm font-medium">Top artworks (30d)</p><ul className="space-y-1">{(data?.topArtworks ?? []).map((item) => <li key={item.id} className="text-sm"><Link className="underline" href={`/artwork/${item.slug || item.id}`}>{item.title}</Link> · {item.views30} views</li>)}</ul></div></CardContent></Card>
      </section>

      <section>
        <Card>
          <CardHeader><CardTitle>My entities</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded border p-3">
              <p className="font-medium">{data?.artist?.name}</p>
              <div className="mt-2 flex flex-wrap gap-2 text-sm">
                <Link className="underline" href="/my/artist">Artist profile</Link>
                <Link className="underline" href="/my/artwork">Artworks</Link>
                <Link className="underline" href="/my/analytics">Analytics</Link>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{(data?.entities?.venues ?? []).map((venue) => <div key={venue.id} className="rounded border p-3 text-sm"><p className="font-medium">{venue.name}</p><Badge variant={venue.isPublished ? "default" : "secondary"} className="mt-1">{venue.isPublished ? "Published" : "Draft"}</Badge><div className="mt-2"><Link href="/my/venues" className="underline">Manage venue</Link></div></div>)}</div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
