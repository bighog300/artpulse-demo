"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { FollowButton } from "@/components/follows/follow-button";
import { RecommendedFollowsSkeleton } from "@/components/onboarding/recommended-follows-skeleton";
import { track } from "@/lib/analytics/client";

type RecommendationItem = {
  id: string;
  slug: string;
  name: string;
  followersCount: number;
  reason?: string;
  imageUrl?: string | null;
  subtitle?: string | null;
};

type RecommendationsPayload = {
  artists: RecommendationItem[];
  venues: RecommendationItem[];
};

export function RecommendedFollows({ page, source, isAuthenticated }: { page: string; source: string; isAuthenticated: boolean }) {
  const [tab, setTab] = useState<"artists" | "venues">("artists");
  const [data, setData] = useState<RecommendationsPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/recommendations/follows?limit=8", { cache: "no-store" });
        if (!res.ok) {
          setData({ artists: [], venues: [] });
          return;
        }
        const payload = (await res.json()) as RecommendationsPayload;
        if (!cancelled) setData(payload);
      } catch {
        if (!cancelled) setData({ artists: [], venues: [] });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const items = useMemo(() => (tab === "artists" ? data?.artists ?? [] : data?.venues ?? []), [data, tab]);

  useEffect(() => {
    if (loading || !data) return;
    track("recommended_follows_shown", { page, type: tab === "artists" ? "artist" : "venue" });
  }, [data, loading, page, tab]);

  if (loading) return <RecommendedFollowsSkeleton />;
  if (!data || (!data.artists.length && !data.venues.length)) return null;

  return (
    <div className="space-y-3 rounded-lg border p-3">
      <div className="flex items-center justify-between">
        <div className="inline-flex rounded-md border border-border p-1">
          <button type="button" className={`rounded px-2 py-1 text-sm ${tab === "artists" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`} onClick={() => setTab("artists")}>Artists</button>
          <button type="button" className={`rounded px-2 py-1 text-sm ${tab === "venues" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`} onClick={() => setTab("venues")}>Venues</button>
        </div>
        <Link href={tab === "artists" ? "/artists" : "/venues"} className="text-sm underline">See all</Link>
      </div>

      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {items.slice(0, 6).map((item) => {
          const href = tab === "artists" ? `/artists/${item.slug}` : `/venues/${item.slug}`;
          return (
            <li key={item.id} className="rounded-lg border p-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-xs">{item.name.slice(0, 1)}</div>
                  <div>
                    <Link href={href} className="text-sm font-medium underline">{item.name}</Link>
                    <p className="text-xs text-muted-foreground">{item.subtitle || item.reason || "Recommended"}</p>
                  </div>
                </div>
                <FollowButton
                  targetType={tab === "artists" ? "ARTIST" : "VENUE"}
                  targetId={item.id}
                  initialIsFollowing={false}
                  initialFollowersCount={item.followersCount ?? 0}
                  isAuthenticated={isAuthenticated}
                  analyticsSlug={item.slug}
                  onToggled={(nextState) => track("recommended_follow_clicked", { type: tab === "artists" ? "artist" : "venue", slug: item.slug, nextState, source })}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
