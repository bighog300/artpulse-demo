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
  stats?: {
    artworks: { total: number; published: number; drafts: number; missingCover: number };
    views: { last30: number; last7: number; last90: number };
    upcomingEvents: { next30Count: number; nextEvent: { id: string; slug: string; title: string; startAt: string } | null };
    profile: { completenessPct: number; missing: string[] };
  };
  todo?: Array<{ id: string; label: string; count: number; href: string }>;
  drafts?: { artworks: Array<{ id: string; title: string; slug: string | null; coverUrl: string | null; updatedAtISO: string }> };
  topArtworks30?: Array<{ id: string; title: string; slug: string | null; coverUrl: string | null; views30: number }>;
  recent?: Array<{ label: string; href: string; occurredAtISO: string }>;
};

export function MyDashboardClient() {
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const response = await fetch("/api/my/dashboard", { cache: "no-store" });
    const payload = await response.json() as DashboardPayload;
    setData(payload);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, idx) => <Skeleton key={idx} className="h-32 w-full" />)}</div>;

  if (data?.needsOnboarding) {
    return <Card><CardHeader><CardTitle>Welcome to your Creator Hub</CardTitle></CardHeader><CardContent className="space-y-3"><p className="text-sm text-muted-foreground">{data.message}</p><Button asChild><Link href={data.nextHref || "/my/artist"}>Set up my artist profile</Link></Button></CardContent></Card>;
  }

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card><CardHeader><CardTitle className="text-base">Artworks</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold">{data?.stats?.artworks.total ?? 0}</p><p className="text-xs text-muted-foreground">{data?.stats?.artworks.published ?? 0} published · {data?.stats?.artworks.drafts ?? 0} drafts</p><Link className="text-sm underline" href="/my/artwork">Manage artworks</Link></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Views</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold">{data?.stats?.views.last30 ?? 0}</p><p className="text-xs text-muted-foreground">7d {data?.stats?.views.last7 ?? 0} · 90d {data?.stats?.views.last90 ?? 0}</p><Link className="text-sm underline" href="/my/analytics">View analytics</Link></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Upcoming events</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold">{data?.stats?.upcomingEvents.next30Count ?? 0}</p><p className="text-xs text-muted-foreground">{data?.stats?.upcomingEvents.nextEvent ? data.stats.upcomingEvents.nextEvent.title : "No upcoming events"}</p><Link className="text-sm underline" href="/my/events">View events</Link></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Profile completeness</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold">{data?.stats?.profile.completenessPct ?? 0}%</p><ul className="mt-1 list-disc pl-4 text-xs text-muted-foreground">{(data?.stats?.profile.missing ?? []).slice(0, 3).map((item) => <li key={item}>{item}</li>)}</ul><Link className="text-sm underline" href="/my/artist">Edit profile</Link></CardContent></Card>
      </section>

      {(data?.todo?.length ?? 0) > 0 ? <section><Card><CardHeader><CardTitle>To do</CardTitle></CardHeader><CardContent><ul className="space-y-2">{(data?.todo ?? []).map((item) => <li key={item.id} className="flex items-center justify-between gap-3"><span className="text-sm">{item.label}</span><span className="flex items-center gap-2"><Badge variant="secondary">{item.count}</Badge><Button asChild size="sm" variant="outline"><Link href={item.href}>Fix</Link></Button></span></li>)}</ul></CardContent></Card></section> : null}

      <section className="grid gap-3 lg:grid-cols-2">
        <Card><CardHeader><CardTitle>Recent</CardTitle></CardHeader><CardContent>{(data?.recent?.length ?? 0) === 0 ? <p className="text-sm text-muted-foreground">No recent updates yet.</p> : <ul className="space-y-1">{(data?.recent ?? []).map((item) => <li key={`${item.href}-${item.occurredAtISO}`}><Link className="text-sm underline" href={item.href}>{item.label}</Link></li>)}</ul>}</CardContent></Card>
        <Card><CardHeader><CardTitle>Drafts + Top artworks</CardTitle></CardHeader><CardContent className="space-y-4"><div><p className="mb-1 text-sm font-medium">Drafts</p><ul className="space-y-1">{(data?.drafts?.artworks ?? []).map((item) => <li key={item.id} className="text-sm"><Link className="underline" href={`/my/artwork/${item.id}`}>{item.title}</Link></li>)}</ul></div><div><p className="mb-1 text-sm font-medium">Top artworks (30d)</p><ul className="space-y-1">{(data?.topArtworks30 ?? []).map((item) => <li key={item.id} className="text-sm"><Link className="underline" href={`/artwork/${item.slug || item.id}`}>{item.title}</Link> · {item.views30}</li>)}</ul></div></CardContent></Card>
      </section>
    </div>
  );
}
