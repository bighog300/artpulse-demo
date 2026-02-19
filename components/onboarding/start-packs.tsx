"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FollowButton } from "@/components/follows/follow-button";
import { StartPackCard } from "@/components/onboarding/start-pack-card";
import { StartPackSkeleton } from "@/components/onboarding/start-pack-skeleton";
import { track } from "@/lib/analytics/client";
import { START_PACKS, type StartPackDefinition } from "@/lib/onboarding/start-packs";
import { enqueueToast } from "@/lib/toast";

type RecommendationItem = {
  id: string;
  slug: string;
  name: string;
  followersCount: number;
  reason?: string;
  subtitle?: string | null;
};

type Candidate = RecommendationItem & { entityType: "ARTIST" | "VENUE" };

type RecommendationsPayload = {
  artists: RecommendationItem[];
  venues: RecommendationItem[];
};

function pickCandidates(pack: StartPackDefinition, payload: RecommendationsPayload): Candidate[] {
  const artistCandidates = payload.artists.map((item) => ({ ...item, entityType: "ARTIST" as const }));
  const venueCandidates = payload.venues.map((item) => ({ ...item, entityType: "VENUE" as const }));
  const source = pack.type === "artist" ? artistCandidates : pack.type === "venue" ? venueCandidates : [...artistCandidates, ...venueCandidates];

  const matches = source.filter((item) => {
    const haystack = `${item.name} ${item.reason ?? ""} ${item.subtitle ?? ""}`.toLowerCase();
    return pack.keywords.some((keyword) => haystack.includes(keyword.toLowerCase()));
  });

  return (matches.length ? matches : source).slice(0, 12);
}

export function StartPacks({ page, isAuthenticated }: { page: string; isAuthenticated: boolean }) {
  const [activePack, setActivePack] = useState<StartPackDefinition | null>(null);
  const [data, setData] = useState<RecommendationsPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [followedIds, setFollowedIds] = useState<Record<string, boolean>>({});
  const [pendingById, setPendingById] = useState<Record<string, boolean>>({});
  const [followAllState, setFollowAllState] = useState<{ attempted: number; succeeded: number; failed: number } | null>(null);
  const [followAllRunning, setFollowAllRunning] = useState(false);
  const shownTrackedRef = useRef(false);
  const abortControllersRef = useRef<Set<AbortController>>(new Set());

  useEffect(() => {
    if (shownTrackedRef.current) return;
    shownTrackedRef.current = true;
    track("start_pack_shown", { page });
  }, [page]);

  useEffect(() => {
    if (!activePack) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setData(null);
      setFollowAllState(null);
      try {
        const response = await fetch("/api/recommendations/follows?limit=24", { cache: "no-store" });
        if (!response.ok) {
          if (!cancelled) setData({ artists: [], venues: [] });
          return;
        }
        const payload = (await response.json()) as RecommendationsPayload;
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
  }, [activePack]);

  const candidates = useMemo(() => {
    if (!activePack || !data) return [];
    return pickCandidates(activePack, data);
  }, [activePack, data]);

  const selectedCount = candidates.filter((candidate) => followedIds[candidate.id]).length;

  const closeDialog = (nextOpen: boolean) => {
    if (!nextOpen) {
      abortControllersRef.current.forEach((controller) => controller.abort());
      abortControllersRef.current.clear();
      setPendingById({});
      setActivePack(null);
    }
  };

  const followOne = async (candidate: Candidate) => {
    const controller = new AbortController();
    abortControllersRef.current.add(controller);
    setPendingById((prev) => ({ ...prev, [candidate.id]: true }));

    try {
      const response = await fetch("/api/follows", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ targetType: candidate.entityType, targetId: candidate.id }),
        signal: controller.signal,
      });
      if (!response.ok) return false;
      setFollowedIds((prev) => ({ ...prev, [candidate.id]: true }));
      window.dispatchEvent(new CustomEvent("artpulse:follow_toggled", { detail: { nextState: "followed" } }));
      return true;
    } catch {
      return false;
    } finally {
      abortControllersRef.current.delete(controller);
      setPendingById((prev) => ({ ...prev, [candidate.id]: false }));
    }
  };

  const runWithConcurrency = async (items: Candidate[], worker: (item: Candidate) => Promise<boolean>, concurrency: number) => {
    let cursor = 0;
    let succeeded = 0;

    const workers = Array.from({ length: Math.min(concurrency, items.length) }).map(async () => {
      while (cursor < items.length) {
        const index = cursor;
        cursor += 1;
        const ok = await worker(items[index]);
        if (ok) succeeded += 1;
      }
    });

    await Promise.all(workers);
    return { attempted: items.length, succeeded, failed: Math.max(0, items.length - succeeded) };
  };

  const onFollowAll = async () => {
    const pendingCandidates = candidates.filter((candidate) => !followedIds[candidate.id]);
    if (!activePack || !pendingCandidates.length) return;

    setFollowAllRunning(true);
    track("start_pack_follow_all_clicked", { packId: activePack.id, count: pendingCandidates.length });
    const result = await runWithConcurrency(pendingCandidates, followOne, 3);
    setFollowAllState(result);
    setFollowAllRunning(false);
    track("start_pack_follow_result", { packId: activePack.id, attempted: result.attempted, succeeded: result.succeeded, failed: result.failed });

    if (result.failed > 0) {
      enqueueToast({ title: `Followed ${result.succeeded}/${result.attempted}. Some picks could not be followed.`, variant: "error" });
      return;
    }
    enqueueToast({ title: `Followed ${result.succeeded} picks` });
  };

  return (
    <section className="space-y-3 rounded-lg border p-3">
      <div>
        <h3 className="text-sm font-semibold">Start Packs</h3>
        <p className="text-xs text-muted-foreground">Quick bundles to jump-start your follows in one flow.</p>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {START_PACKS.map((pack) => (
          <StartPackCard
            key={pack.id}
            pack={pack}
            onOpen={(nextPack) => {
              setActivePack(nextPack);
              track("start_pack_opened", { packId: nextPack.id });
            }}
          />
        ))}
      </div>

      <Dialog open={Boolean(activePack)} onOpenChange={closeDialog}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{activePack?.title}</DialogTitle>
            <DialogDescription>{activePack?.description}</DialogDescription>
          </DialogHeader>

          {loading ? <StartPackSkeleton /> : null}

          {!loading && activePack ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{selectedCount} selected</p>
                <button type="button" className="rounded border px-2 py-1 text-sm" onClick={onFollowAll} disabled={!isAuthenticated || !candidates.length || followAllRunning}>
                  {followAllRunning ? "Following..." : "Follow all"}
                </button>
              </div>

              {!candidates.length ? <p className="text-sm text-muted-foreground">No direct matches yet. Try this pack again later for refreshed starter picks.</p> : null}

              <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {candidates.map((item) => (
                  <li key={`${item.entityType}-${item.id}-${followedIds[item.id] ? "1" : "0"}`} className="rounded-lg border p-2">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.subtitle || item.reason || activePack.fallbackLabel || "Starter picks"}</p>
                      </div>
                      <div className={pendingById[item.id] ? "opacity-70" : ""}>
                        <FollowButton
                          targetType={item.entityType}
                          targetId={item.id}
                          initialIsFollowing={Boolean(followedIds[item.id])}
                          initialFollowersCount={item.followersCount ?? 0}
                          isAuthenticated={isAuthenticated}
                          analyticsSlug={item.slug}
                          onToggled={(nextState) => {
                            setFollowedIds((prev) => ({ ...prev, [item.id]: nextState === "followed" }));
                            track("start_pack_entity_follow_clicked", {
                              packId: activePack.id,
                              type: item.entityType === "ARTIST" ? "artist" : "venue",
                              slug: item.slug,
                              nextState,
                            });
                          }}
                        />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              {followAllState ? <p className="text-xs text-muted-foreground">Followed {followAllState.succeeded}/{followAllState.attempted} · Failed {followAllState.failed}</p> : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}
