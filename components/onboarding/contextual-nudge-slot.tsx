"use client";

import { useEffect, useState } from "react";
import { ActivationNudge } from "@/components/onboarding/activation-nudge";
import { getOnboardingSignals, type OnboardingSignals } from "@/lib/onboarding/signals";
import { getOnboardingState } from "@/lib/onboarding/state";

export function ContextualNudgeSlot({
  page,
  type,
  destination,
  title,
  body,
  nudgeId,
}: {
  page: string;
  type: "event_detail_follow" | "entity_save_search" | "following_save_search";
  destination: string;
  title: string;
  body: string;
  nudgeId: string;
}) {
  const [signals, setSignals] = useState<OnboardingSignals | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const next = await getOnboardingSignals();
      if (!cancelled) setSignals(next);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const onboarding = getOnboardingState();
  const notActivated = !onboarding.completed;
  const enabled = type === "event_detail_follow"
    ? Boolean(signals && notActivated && signals.followsCount < 3)
    : type === "entity_save_search"
      ? Boolean(signals && notActivated && signals.savedSearchesCount === 0)
      : Boolean(signals && signals.followsCount > 0 && signals.savedSearchesCount === 0);

  return <ActivationNudge nudgeId={nudgeId} page={page} title={title} body={body} ctaLabel={type === "event_detail_follow" ? "Follow now" : "Create a saved search"} destination={destination} enabled={enabled} />;
}
