"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { track } from "@/lib/analytics/client";
import { getOnboardingState, getTipsState, markTipSeen, dismissTips } from "@/lib/onboarding/state";
import { POST_ACTIVATION_TIPS } from "@/lib/onboarding/tips";

const WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const COMPLETION_SESSION_KEY = "ap_onboarding_completion_seen";

export function PostActivationTips() {
  const [visibleTipId, setVisibleTipId] = useState<string | null>(null);

  useEffect(() => {
    const onboarding = getOnboardingState();
    const tips = getTipsState();
    if (!onboarding.completed || !onboarding.completedAt || tips.dismissed) return;
    if (typeof window !== "undefined" && window.sessionStorage.getItem(COMPLETION_SESSION_KEY) === "true") return;
    if (Date.now() - onboarding.completedAt > WINDOW_MS) return;

    const next = POST_ACTIVATION_TIPS.find((tip) => !tips.seenIds.includes(tip.id));
    if (!next) return;
    markTipSeen(next.id);
    setVisibleTipId(next.id);
    track("post_activation_tip_shown", { tipId: next.id });
  }, []);

  const tip = useMemo(() => POST_ACTIVATION_TIPS.find((item) => item.id === visibleTipId) ?? null, [visibleTipId]);
  if (!tip) return null;

  return (
    <aside className="rounded-lg border bg-amber-50 p-3">
      <p className="text-sm font-semibold">{tip.title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{tip.description}</p>
      <div className="mt-2 flex items-center gap-3 text-sm">
        <Link href={tip.destination} className="underline" onClick={() => track("post_activation_tip_clicked", { tipId: tip.id, destination: tip.destination })}>{tip.ctaLabel}</Link>
        <button
          type="button"
          className="text-muted-foreground underline"
          onClick={() => {
            dismissTips();
            track("post_activation_tip_dismissed", { tipId: tip.id });
            setVisibleTipId(null);
          }}
        >
          Got it
        </button>
      </div>
    </aside>
  );
}
