"use client";

import { useEffect, useMemo, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { OnboardingBanner } from "@/components/onboarding/onboarding-banner";
import { getOnboardingState, setOnboardingCompleted, setOnboardingStep } from "@/lib/onboarding/state";
import { track } from "@/lib/analytics/client";
import type { OnboardingStepStatus } from "@/components/onboarding/onboarding-progress";

type Signals = {
  follows: number;
  savedSearches: number;
  savedEvents: number;
  hasLocation: boolean;
};

const COMPLETION_SESSION_KEY = "ap_onboarding_completion_seen";

function getSessionStorage() {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) return null;
    return response.json() as Promise<T>;
  } catch {
    return null;
  }
}

export function OnboardingGate({ page, isAuthenticated }: { page: string; isAuthenticated: boolean }) {
  const [hydrated, setHydrated] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [signals, setSignals] = useState<Signals>({ follows: 0, savedSearches: 0, savedEvents: 0, hasLocation: false });
  const [showCompletion, setShowCompletion] = useState(false);

  useEffect(() => {
    setHydrated(true);
    const stored = getOnboardingState();
    setDismissed(stored.dismissed);
    setCompleted(stored.completed);
  }, []);

  useEffect(() => {
    if (!hydrated || !isAuthenticated || dismissed || completed) return;
    let cancelled = false;

    (async () => {
      const [follows, savedSearches, favorites, location] = await Promise.all([
        fetchJson<{ counts?: { total?: number } }>("/api/follows"),
        fetchJson<{ items?: unknown[] }>("/api/saved-searches"),
        fetchJson<{ items?: Array<{ targetType?: string }> }>("/api/favorites"),
        fetchJson<{ locationLabel?: string | null; lat?: number | null; lng?: number | null }>("/api/me/location"),
      ]);

      if (cancelled) return;
      const nextSignals = {
        follows: follows?.counts?.total ?? 0,
        savedSearches: savedSearches?.items?.length ?? 0,
        savedEvents: (favorites?.items ?? []).filter((item) => item.targetType === "EVENT").length,
        hasLocation: Boolean(location?.locationLabel) || (typeof location?.lat === "number" && typeof location?.lng === "number"),
      };
      setSignals(nextSignals);

      const completionMethod = nextSignals.follows >= 3 ? "follow" : nextSignals.savedSearches >= 1 ? "saved_search" : nextSignals.savedEvents >= 1 ? "saved_event" : null;
      if (completionMethod) {
        setOnboardingCompleted(true);
        setOnboardingStep("done");
        setCompleted(true);
        track("onboarding_completed", { method: completionMethod });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [completed, dismissed, hydrated, isAuthenticated]);

  useEffect(() => {
    if (!completed) return;
    const session = getSessionStorage();
    if (session?.getItem(COMPLETION_SESSION_KEY) === "true") {
      setShowCompletion(false);
      return;
    }
    session?.setItem(COMPLETION_SESSION_KEY, "true");
    setShowCompletion(true);
  }, [completed]);


  useEffect(() => {
    if (typeof window === "undefined") return;
    const onFollowToggle = (event: Event) => {
      const customEvent = event as CustomEvent<{ nextState?: "followed" | "unfollowed" }>;
      if (!customEvent.detail?.nextState) return;
      setSignals((prev) => ({ ...prev, follows: Math.max(0, prev.follows + (customEvent.detail.nextState === "followed" ? 1 : -1)) }));
    };
    window.addEventListener("artpulse:follow_toggled", onFollowToggle);
    return () => window.removeEventListener("artpulse:follow_toggled", onFollowToggle);
  }, []);

  const steps = useMemo<OnboardingStepStatus[]>(() => ([
    { key: "follow", label: "Follow artists/venues", detail: `You're following ${signals.follows}`, done: signals.follows >= 3 },
    { key: "saved_search", label: "Save a search", detail: `Saved searches: ${signals.savedSearches}`, done: signals.savedSearches >= 1 },
    { key: "saved_event", label: "Save an event", detail: `Saved events: ${signals.savedEvents}`, done: signals.savedEvents >= 1 },
    { key: "location", label: "Enable nearby (optional)", detail: signals.hasLocation ? "Location is enabled" : "Nearby works when your device shares location", done: signals.hasLocation },
  ]), [signals]);

  if (!isAuthenticated) return null;
  if (!hydrated) return <Skeleton className="h-20 w-full" />;
  if (dismissed) return null;

  if (completed) {
    if (!showCompletion) return null;
    return <OnboardingBanner page={page} steps={steps} onDismiss={() => setDismissed(true)} completionMessage="You're all set — nice work personalizing your feed. Next step: explore events picked for you." hasLocation={signals.hasLocation} isAuthenticated={isAuthenticated} />;
  }

  return <OnboardingBanner page={page} steps={steps} onDismiss={() => setDismissed(true)} hasLocation={signals.hasLocation} isAuthenticated={isAuthenticated} />;
}
